<?php

namespace FashionCalendarModule\Controller;

use Laminas\Mvc\Controller\AbstractActionController;
use Omeka\Mvc\Exception\RuntimeException;
use SolrClient;
use SolrClientException;
use SolrQuery;

class SearchController extends AbstractActionController
{
    public function searchAction()
    {
        if ($this->currentSite()->slug() == "fashioncalendar" && ($settings = $this->settings()) && ($settings->get('fcm_solr_connection')) && ($host = $settings->get('fcm_solr_hostname')) && ($port = $settings->get('fcm_solr_port')) && ($path = $settings->get('fcm_solr_path')) && ($params = $this->params()->fromQuery()) && array_key_exists('q', $params) && ($q = $params['q']) && ($item_id = $this->params('item-id'))) {
            $response = $this->getResponse();
            $client = new SolrClient([
                'hostname' => $host,
                'port' => $port,
                'path' => $path,
                'login' => $settings->get('fcm_solr_login') ? $settings->get('fcm_solr_login') : "",
                'password' => $settings->get('fcm_solr_password') ? $settings->get('fcm_solr_password') : "",
                'wt' => 'json',
            ]);
            $solrQuery = new SolrQuery;
            $solrQuery->setQuery('ocr_text:"' . urldecode($q) . '"');
            $solrQuery->setHighlight(true);
            $solrQuery->setHighlightSnippets(4096);
            $solrQuery->addparam('hl.ocr.fl', 'ocr_text');
            $solrQuery->addFilterQuery('id:' . $item_id);
            try {
                $solrQueryResponse = $client->query($solrQuery);
                $ocrHighlighting = $solrQueryResponse->getResponse()['ocrHighlighting'];
                $hlresp = [
                    'numTotal' => 0,
                    'snippets' => []
                ];
                foreach ($ocrHighlighting as $page_snips) {
                    foreach ($page_snips['ocr_text']['snippets'] as $snips) {
                        $hlresp['snippets'][] = $snips;
                    }
                    $hlresp['numTotal'] += $page_snips['ocr_text']['numTotal'];
                }
                $doc = [
                    "@context" => [
                        "http://iiif.io/api/presentation/2/context.json",
                        "http://iiif.io/api/search/0/context.json"
                    ],
                    "@type" => "sc:AnnotationList",

                    "within" => [
                        "@type" => "sc:Layer"
                    ],

                    "resources" => [],
                    "hits" => []
                ];
                $doc['@id'] = $this->url()->fromRoute(null, [], ['force_canonical' => true], true) . '?q=' . urlencode($q);
                $doc['within']['total'] = $hlresp['numTotal'];
                $ignored = [];
                foreach (array_keys($params) as $key) {
                    if ($key != "q") {
                        $ignored[] = $key;
                    }
                }
                $api = $this->api();
                $item = $api->read('items', $item_id)->getContent();
                $media = $item->media();
                // Get first page to get index offset
                $thisFilename = pathinfo($media[0]->mediaData()['access'])['filename'];
                $indexOffset = intval(substr($thisFilename, strrpos($thisFilename, '_') + 1));
                $doc['within']['ignored'] = $ignored;
                // HL_PAT = re.compile("<em>(.+?)</em>");
                foreach ($hlresp['snippets'] as $supidx => $snip) {
                    $text = $snip['text'];
                    preg_match_all('#<em>(.*?)<\/em>#', $text, $matches, PREG_OFFSET_CAPTURE);
                    $hl_textmatches = $matches;
                    foreach ($snip['highlights'] as $idx => $hlspan) {
                        $hl_match = $hl_textmatches[0][$idx];
                        try {
                            $before = str_replace(["<em>", "</em>"], "", substr($text, 0, $hl_match[1]));
                            $after = str_replace(["<em>", "</em>"], "", substr($text, $hl_match[1] + strlen($hl_match[0])));
                        } catch (Exception $e) {
                            $before = null;
                            $after = null;
                        }
                        $hl_text = $hl_textmatches[1][$idx][0];
                        $anno_ids = [];
                        foreach ($hlspan as $subidx => $hlbox) {
                            $region = $snip['regions'][$hlbox['parentRegionIdx']];
                            $page = $snip['pages'][$region['pageIdx']]['id'];
                            $pageIndex = intval(preg_replace('/[^0-9]/', '', $page)) - $indexOffset;
                            if (isset($media[$pageIndex])) {
                                $x = $region['ulx'] + $hlbox['ulx'];
                                $y = $region['uly'] + $hlbox['uly'];
                                $w = $hlbox['lrx'] - $hlbox['ulx'];
                                $h = $hlbox['lry'] - $hlbox['uly'];
                                $ident = $this->url()->fromRoute('iiif-presentation-3/item/manifest', ['item-id' => $item_id], ['force_canonical' => true]) . '/annotation/' . urlencode($q) . '-' . $supidx . '-' . $idx . '-' . $subidx;
                                $anno_ids[] = $ident;
                                $anno = [
                                    "@id" => $ident,
                                    "@type" => "oa:Annotation",
                                    "motivation" => "sc:painting",
                                    "resource" => [
                                        "@type" => "cnt:ContentAsText",
                                        "chars" => $hlbox['text']
                                    ],
                                    "on" => $this->url()->fromRoute('iiif-presentation-3/item/canvas', ['item-id' => $item_id, 'media-id' => $media[$pageIndex]->id()], ['force_canonical' => true]) . '#xywh=' . $x . ',' . $y . ',' . $w . ',' . $h
                                ];
                                $doc['resources'][] = $anno;
                            }
                        }
                        $doc['hits'][] = [
                            '@type' => 'search:Hit',
                            'annotations' => $anno_ids,
                            'match' => $hl_text,
                            'before' => $before,
                            'after' => $after,
                        ];
                    }
                }
                $response->setContent(json_encode($doc, JSON_PRETTY_PRINT));
                $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                $response->getHeaders()->addHeaderLine('Access-Control-Allow-Origin', '*');
                return $response;
            } catch (SolrClientException $e) {
                $error = array('error' => ["code" => $e->getCode(), "message" => $e->getMessage()]);
                $response->setStatusCode(500);
                $response->setContent(json_encode($error));
                $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                return $response;
            }
        } else {
            throw new RuntimeException("Invalid Page");
        }
    }
}
