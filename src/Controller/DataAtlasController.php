<?php

namespace FashionCalendarModule\Controller;

use Laminas\Mvc\Controller\AbstractActionController;
use Omeka\Mvc\Exception\RuntimeException;
use MongoDB\Client;
use MongoDB\Driver\ServerApi;
use MongoDB\BSON\UTCDateTime;
use MongoDB\BSON\Regex;

class DataAtlasController extends AbstractActionController
{
    public function eventsAction()
    {
        if ($this->currentSite()->slug() == "fashioncalendar") {
            $response = $this->getResponse();
            $settings = $this->settings();
            $connectionFormat = "mongodb+srv";
            if ($settings->get('fcm_mongo_connection_format')) {
                $connectionFormat = $settings->get('fcm_mongo_connection_format');
            }
            $uri = $connectionFormat . "://" . $settings->get('fcm_mongo_user') . ":" . $settings->get('fcm_mongo_password') . "@" . $settings->get('fcm_mongo_url') . "/?retryWrites=true&w=majority";
            // Specify Stable API version 1
            $apiVersion = new ServerApi(ServerApi::V1);
            // Create a new client and connect to the server
            $client = new Client($uri, [], ['serverApi' => $apiVersion]);
            $params = $this->params()->fromQuery();
            $docs_per_page = 50;
            $map_docs_per_page = 5000;
            $collection = $client->selectCollection($settings->get('fcm_mongo_db'), 'events');
            $hasText = false;
            $search = [
                '$search' => [
                    'index' => 'atlas-search',
                ]
            ];
            $compound = [];
            if (array_key_exists('text', $params) && ($text = $params['text'])) {
                $type = 'text';
                if (str_starts_with($text, '"') && str_ends_with($text, '"')) {
                    $type = 'phrase';
                    $text = substr($text, 1);
                    $text = substr($text, 0, -1);
                }
                $compound['must'] = [[$type => ['query' => $text, 'path' => ['what', 'when', 'who', 'where', 'description', 'names.label']]]];
                $hasText = true;
            }
            // Default sort
            $sort = ['start_date_iso' => 1, '_id' => 1];
            if (array_key_exists('sort', $params) && ($sortParam = $params['sort']) && (($sortParam == "asc") || ($sortParam == "desc") || ($sortParam == "text"))) {
                switch ($sortParam) {
                    case 'asc':
                        $sort = ['start_date_iso' => 1, '_id' => 1];
                        break;
                    case 'desc':
                        $sort = ['start_date_iso' => -1, '_id' => 1];
                        break;
                    case 'text':
                        if ($hasText) {
                            $sort = ['unused' => ['$meta' => 'searchScore'], '_id' => 1];
                        }
                        break;
                }
            } elseif ($hasText) {
                $sort = ['unused' => ['$meta' => 'searchScore'], '_id' => 1];
            }
            if (array_key_exists('names', $params) && ($names = $params['names'])) {
                $names = is_array($names) ? $names : [$names];
                foreach ($names as $name) {
                    $compound['filter'][] = ['text' => ['query' => $name, 'path' => ['value' => 'names.label', 'multi' => 'facet']]];
                }
            }
            if (array_key_exists('adv_name', $params) && ($names = $params['adv_name'])) {
                $names = is_array($names) ? $names : [$names];
                //AND
                if (array_key_exists('adv_name_type', $params) && ($params['adv_name_type'] == "AND")) {
                    foreach ($names as $name) {
                        $compound['filter'][] = ['text' => ['query' => $name, 'path' => ['value' => 'names.label', 'multi' => 'facet']]];
                    }
                }
                //OR
                else {
                    $shouldList = [];
                    foreach ($names as $name) {
                        $shouldList[] = ['text' => ['query' => $name, 'path' => ['value' => 'names.label', 'multi' => 'facet']]];
                    }
                    $compound['filter'][] = ['compound' => ['should' => $shouldList, 'minimumShouldMatch' => 1]];
                }
            }

            if (array_key_exists('categories', $params) && ($categories = $params['categories'])) {
                $categories = is_array($categories) ? $categories : [$categories];
                foreach ($categories as $category) {
                    $compound['filter'][] = ['text' => ['query' => $category, 'path' => 'names.categories.label']];
                }
            }
            if (array_key_exists('adv_category', $params) && ($categories = $params['adv_category'])) {
                $categories = is_array($categories) ? $categories : [$categories];
                //AND
                if (array_key_exists('adv_category_type', $params) && ($params['adv_category_type'] == "AND")) {
                    foreach ($categories as $category) {
                        $compound['filter'][] = ['text' => ['query' => $category, 'path' => 'names.categories.label']];
                    }
                }
                //OR
                else {
                    $shouldList = [];
                    foreach ($categories as $category) {
                        $shouldList[] = ['text' => ['query' => $category, 'path' => 'names.categories.label']];
                    }
                    $compound['filter'][] = ['compound' => ['should' => $shouldList, 'minimumShouldMatch' => 1]];
                }
            }
            if (array_key_exists('issue', $params) && ($issue = $params['issue'])) {
                $compound['filter'][] = ['text' => ['query' => $issue, 'path' => 'appears_in.calendar_id']];
            }
            if (array_key_exists('titles', $params) && ($titles = $params['titles']) && (($titles == "Fashion Calendar") || ($titles == "Home Furnishings Calendar"))) {
                $compound['filter'][] = ['text' => ['query' => $titles, 'path' => 'appears_in.calendar_title']];
            }
            if (array_key_exists('year', $params) && ($year = $params['year']) && (strlen($year) == 4) && is_numeric($year)) {
                $compound['filter'][] = ['range' => ['path' => 'start_date_iso', 'gte' => new UTCDateTime(strtotime($year . '-01-01') * 1000), 'lt' => new UTCDateTime(strtotime(strval($year + 1) . '-01-01') * 1000)]];
            }
            if (array_key_exists('date_range_start', $params) && array_key_exists('date_range_end', $params) && ($date_range_start = $params['date_range_start']) && ($date_range_end = $params['date_range_end']) && (strlen($date_range_start) == 4) && (strlen($date_range_end) == 4) && is_numeric($date_range_start) && is_numeric($date_range_end) && $date_range_start <= $date_range_end) {
                $compound['filter'][] = ['range' => ['path' => 'start_date_iso', 'gte' => new UTCDateTime(strtotime($date_range_start . '-01-01') * 1000), 'lt' => new UTCDateTime(strtotime(strval($date_range_end + 1) . '-01-01') * 1000)]];
            }
            if (array_key_exists('year_month', $params) && ($year_month = $params['year_month']) && (strlen($year_month) == 7) && (strpos($year_month, '-') == 4)) {
                $year = explode("-", $year_month)[0];
                $month = explode("-", $year_month)[1];
                if (is_numeric($year) && is_numeric($month) && ($month <= 12)) {
                    if ($month == '12') {
                        $end_year_month = strval($year + 1) . "-01";
                    } else {
                        $end_year_month = $year . "-" . sprintf('%02d', strval($month + 1));
                    }
                    $compound['filter'][] = ['range' => ['path' => 'start_date_iso', 'gte' => new UTCDateTime(strtotime($year_month) * 1000), 'lt' => new UTCDateTime(strtotime($end_year_month) * 1000)]];
                }
            }
            if (array_key_exists('location', $params) && ($location = $params['location'])) {
                $maxDistance = 0;
                if (array_key_exists('max_distance', $params) && ($max_distance = $params['max_distance']) && is_numeric($max_distance)) {
                    $maxDistance = floatval($max_distance);
                }
                $compound['filter'][] = ['geoWithin' => ['circle' => ['center' => ['type' => 'Point', 'coordinates' => json_decode('[' . $location . ']', true)], 'radius' => $maxDistance], 'path' => 'location']];
            }
            // Check if graph data is all that is needed
            if (array_key_exists('graph', $params) && ($params['graph'] == 'true')) {
                $yearBoundaries = [];
                for ($i = 1941; $i < 2017; $i++) {
                    $yearBoundaries[] = new UTCDateTime(strtotime($i . '-01-01') * 1000);
                }
                $searchMeta = [
                    '$searchMeta' => [
                        'index' => 'atlas-search',
                        'facet' => [
                            'facets' => [
                                'names' => ['type' => 'string', 'path' => 'names.label', 'numBuckets' => 1000],
                                'categories' => ['type' => 'string', 'path' => 'names.categories.label', 'numBuckets' => 1000],
                                'years' => ['type' => 'date', 'path' => 'start_date_iso', 'boundaries' => $yearBoundaries]
                            ]
                        ]
                    ]
                ];
                if ($compound) {
                    $searchMeta['$searchMeta']['facet']['operator']['compound'] = $compound;
                }
                $aggregation[] = $searchMeta;
                $aggregation[] = ['$project' => ['names' => ['$map' => ['input' => '$facet.names.buckets', 'in' => ['name' => '$$this._id', 'count' => '$$this.count']]], 'categories' => ['$map' => ['input' => '$facet.categories.buckets', 'in' => ['category' => '$$this._id', 'count' => '$$this.count']]], 'years' => ['$map' => ['input' => '$facet.years.buckets', 'in' => ['year' => ['$year' => '$$this._id'], 'count' => '$$this.count']]]]];
                $aggregation[] = ['$project' => ['names' => 1, 'categories' => 1, 'years' => ['$filter' => ['input' => '$years', 'as' => 'year', 'cond' => ['$gt' => ['$$year.count', 0]]]]]];
            } elseif (array_key_exists('ngram', $params) && ($params['ngram'] == 'true') && $hasText) {
                $regex = "\b" . preg_replace('/^(\'[^\']*\'|"[^"]*")$/', '$2$3', $text) . "\b";
                $search['$search']['compound'] = $compound;
                $aggregation[] = $search;
                $aggregation[] = ['$addFields' => ['occurrences' => ['$regexFindAll' => ['input' => ['$concat' => ['$what', ' ', '$when', ' ', '$who', ' ', '$where', ' ', '$description']], 'regex' => new Regex($regex, "i")]]]];
                $aggregation[] = ['$unwind' => ['path' => '$occurrences']];
                $aggregation[] = ['$group' => ['_id' => ['$year' => '$start_date_iso'], 'count' => ['$sum' => 1]]];
                $aggregation[] = ['$sort' => ['_id' => 1]];
                $aggregation[] = ['$project' => ['_id' => 0, 'year' => '$_id', 'count' => 1]];
            } elseif (array_key_exists('map', $params) && ($params['map'] == 'true')) {
                if (array_key_exists('mappage', $params) && ($mappage = $params['mappage']) && is_numeric($mappage)) {
                    $skip = ['$skip' => $map_docs_per_page * ($mappage - 1)];
                } else {
                    $skip = ['$skip' => 0];
                }
                $limit = ['$limit' => $map_docs_per_page];
                if ($compound) {
                    $search['$search']['compound'] = $compound;

                } else {
                    $search['$search']['facet'] = ['facets' => ['titles' => ['type' => 'string', 'path' => 'appears_in.calendar_title', 'numBuckets' => 1]]];
                }
                $search['$search']['sort'] = $sort;
                $search['$search']['count'] = [
                    "type" => "total"
                ];
                $aggregation[] = $search;
                $aggregation[] = $skip;
                $aggregation[] = $limit;

                $facet = [
                    '$facet' => [
                        'results' => [],
                        'count' => [
                            ['$limit' => 1],
                            ['$project' => ['count' => '$$SEARCH_META']]
                        ]
                    ]
                ];
                $aggregation[] = $facet;
                $aggregation[] = ['$project' => ['results' => 1, 'count' => ['$first' => '$count']]];
                $aggregation[] = ['$project' => ['results' => 1, 'count' => '$count.count.count.total']];
            } elseif (array_key_exists('facet', $params) && ($params['facet'] == 'true')) {
                $yearBoundaries = [];
                for ($i = 1941; $i < 2017; $i++) {
                    $yearBoundaries[] = new UTCDateTime(strtotime($i . '-01-01') * 1000);
                }
                $searchMeta = [
                    '$searchMeta' => [
                        'index' => 'atlas-search',
                        'facet' => [
                            'facets' => [
                                'names' => ['type' => 'string', 'path' => 'names.label', 'numBuckets' => 25],
                                'categories' => ['type' => 'string', 'path' => 'names.categories.label', 'numBuckets' => 25],
                                'titles' => ['type' => 'string', 'path' => 'appears_in.calendar_title', 'numBuckets' => 2],
                                'years' => ['type' => 'date', 'path' => 'start_date_iso', 'boundaries' => $yearBoundaries]
                            ]
                        ]
                    ]
                ];
                if ($compound) {
                    $searchMeta['$searchMeta']['facet']['operator']['compound'] = $compound;
                }
                $aggregation[] = $searchMeta;
                $aggregation[] = ['$project' => ['names' => ['$map' => ['input' => '$facet.names.buckets', 'in' => ['name' => '$$this._id', 'count' => '$$this.count']]], 'categories' => ['$map' => ['input' => '$facet.categories.buckets', 'in' => ['category' => '$$this._id', 'count' => '$$this.count']]], 'titles' => ['$map' => ['input' => '$facet.titles.buckets', 'in' => ['title' => '$$this._id', 'count' => '$$this.count']]], 'years' => ['$map' => ['input' => '$facet.years.buckets', 'in' => ['year' => ['$year' => '$$this._id'], 'count' => '$$this.count']]]]];
                $aggregation[] = ['$project' => ['names' => 1, 'categories' => 1, 'titles' => 1, 'years' => ['$filter' => ['input' => '$years', 'as' => 'year', 'cond' => ['$gt' => ['$$year.count', 0]]]]]];
            } elseif (array_key_exists('date_range', $params) && ($params['date_range'] == 'true')) {
                $yearBoundaries = [];
                for ($i = 1941; $i < 2017; $i++) {
                    $yearBoundaries[] = new UTCDateTime(strtotime($i . '-01-01') * 1000);
                }
                $searchMeta = [
                    '$searchMeta' => [
                        'index' => 'atlas-search',
                        'facet' => [
                            'facets' => [
                                'years' => ['type' => 'date', 'path' => 'start_date_iso', 'boundaries' => $yearBoundaries]
                            ]
                        ]
                    ]
                ];
                if ($compound) {
                    $searchMeta['$searchMeta']['facet']['operator']['compound'] = $compound;
                }
                $aggregation[] = $searchMeta;
                $aggregation[] = ['$project' => ['years' => ['$map' => ['input' => '$facet.years.buckets', 'in' => ['year' => ['$year' => '$$this._id'], 'count' => '$$this.count']]]]];
                $aggregation[] = ['$project' => ['years' => ['$filter' => ['input' => '$years', 'as' => 'year', 'cond' => ['$gt' => ['$$year.count', 0]]]]]];
                $aggregation[] = ['$project' => ['earliest' => ['$minN' => ['n' => 1, 'input' => '$years.year']], 'latest' => ['$maxN' => ['n' => 1, 'input' => '$years.year']]]];
                $aggregation[] = ['$project' => ['earliest' => ['$first' => '$earliest'], 'latest' => ['$first' => '$latest']]];
            } elseif (array_key_exists('download', $params) && ($params['download'] == 'true')) {
                if ($compound) {
                    $search['$search']['compound'] = $compound;
                } else {
                    $search['$search']['facet'] = ['facets' => ['titles' => ['type' => 'string', 'path' => 'appears_in.calendar_title', 'numBuckets' => 1]]];
                }
                $search['$search']['sort'] = $sort;
                $aggregation[] = $search;
                $aggregation[] = ['$limit' => 10000];
                $cursor = $collection->aggregate($aggregation);
                $json = "[";
                foreach ($cursor as $document) {
                    $json .= json_encode($document);
                    $json .= ", ";
                }
                $json = substr($json, 0, -2);
                $json .= "]";
                $response->getHeaders()->addHeaderLine('Content-Disposition', 'attachment; filename="fashion-calendar-results.json"');
                $response->setContent($json);
                return $response;

            } else {
                if (array_key_exists('page', $params) && ($page = $params['page']) && is_numeric($page)) {
                    $skip = ['$skip' => $docs_per_page * ($page - 1)];
                } else {
                    $skip = ['$skip' => 0];
                }
                $limit = ['$limit' => $docs_per_page];
                if ($compound) {
                    $search['$search']['compound'] = $compound;
                } else {
                    $search['$search']['facet'] = ['facets' => ['titles' => ['type' => 'string', 'path' => 'appears_in.calendar_title', 'numBuckets' => 1]]];
                }
                $search['$search']['sort'] = $sort;
                $search['$search']['count'] = [
                    "type" => "total"
                ];
                $aggregation[] = $search;
                $aggregation[] = $skip;
                $aggregation[] = $limit;

                $facet = [
                    '$facet' => [
                        'results' => [],
                        'count' => [
                            ['$limit' => 1],
                            ['$project' => ['count' => '$$SEARCH_META']]
                        ]
                    ]
                ];
                $aggregation[] = $facet;
                $aggregation[] = ['$project' => ['results' => 1, 'count' => ['$first' => '$count']]];
                $aggregation[] = ['$project' => ['results' => 1, 'count' => '$count.count.count.total']];
            }


            try {
                $cursor = $collection->aggregate($aggregation);
                $response->setContent(json_encode($cursor->toArray()));
                $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                $response->getHeaders()->addHeaderLine('Cache-Control', 'public, max-age=86400, immutable');
                $response->getHeaders()->addHeaderLine('Pragma', '');
                return $response;
            } catch (Exception $e) {
                $error = array('error' => ["code" => 500, "message" => $e->getMessage()]);
                $response->setStatusCode(500);
                $response->setContent(json_encode($error));
                $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                return $response;
            }

        } else {
            throw new RuntimeException("Invalid Page");
        }
    }

    public function suggesterAction()
    {
        if ($this->currentSite()->slug() == "fashioncalendar") {
            $response = $this->getResponse();
            $params = $this->params()->fromQuery();
            if (array_key_exists('type', $params) && ($type = $params['type']) && (($type == 'names') || ($type == 'categories'))) {
                $settings = $this->settings();
                $connectionFormat = "mongodb+srv";
                if ($settings->get('fcm_mongo_connection_format')) {
                    $connectionFormat = $settings->get('fcm_mongo_connection_format');
                }
                $uri = $connectionFormat . "://" . $settings->get('fcm_mongo_user') . ":" . $settings->get('fcm_mongo_password') . "@" . $settings->get('fcm_mongo_url') . "/?retryWrites=true&w=majority";
                // Specify Stable API version 1
                $apiVersion = new ServerApi(ServerApi::V1);
                // Create a new client and connect to the server
                $client = new Client($uri, [], ['serverApi' => $apiVersion]);
                $collection = $client->selectCollection($settings->get('fcm_mongo_db'), $type);
                try {
                    $distinct = $collection->distinct('label');
                    $response->setContent(json_encode($distinct));
                    $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                    return $response;
                } catch (Exception $e) {
                    $error = array('error' => ["code" => 500, "message" => $e->getMessage()]);
                    $response->setStatusCode(500);
                    $response->setContent(json_encode($error));
                    $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                    return $response;
                }
            } else {
                $error = array('error' => ["code" => 500, "message" => "Invalid request"]);
                $response->setStatusCode(500);
                $response->setContent(json_encode($error));
                $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                return $response;
            }
        } else {
            throw new RuntimeException("Invalid Page");
        }
    }

    public function pageAction()
    {
        if ($this->currentSite()->slug() == "fashioncalendar") {
            $response = $this->getResponse();
            $params = $this->params()->fromQuery();
            if (array_key_exists('id', $params) && ($id = $params['id']) && array_key_exists('page', $params) && ($page = $params['page'])) {
                $page_id = $id . '_' . sprintf('%03d', $page);
                $api = $this->api();
                $identifier = $api->searchOne('properties', ['term' => 'dcterms:identifier'])->getContent();
                $item = $api->searchOne('items', [
                    'property' => [
                        [
                            'property' => $identifier->id(),
                            'type' => 'eq',
                            'text' => $id,
                        ],
                    ],
                ])->getContent();
                if ($item && ($media = $item->media()) && isset($media[$page])) {
                    $miradorViewer = $this->viewHelpers()->get('miradorViewer');
                    $media = $item->media();
                    $response->setContent(json_encode([
                        'html' => $miradorViewer($item, $media[$page]->id()),
                        'item-link' => $item->siteUrl(),
                    ]));
                    $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                    return $response;
                } else {
                    $error = array('error' => ["code" => 500, "message" => "Media not found: " . $page_id]);
                    $response->setStatusCode(500);
                    $response->setContent(json_encode($error));
                    $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                    return $response;
                }

                // If using this method be sure query is not slowed down by resource link subquery
                // $media = $api->searchOne('media', [
                //     'property' => [
                //         [
                //             'property' => $identifier->id(),
                //             'type' => 'eq',
                //             'text' => $page_id,
                //         ],
                //     ],
                // ])->getContent();
                // if ($media) {
                //     $miradorViewer = $this->viewHelpers()->get('miradorViewer');
                //     $response->setContent(json_encode([
                //         'html' => $miradorViewer($media->item(), $media->id()),
                //         'item-link' => $media->item()->siteUrl(),
                //     ]));
                //     $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                //     return $response;
                // } else {
                //     $error = array('error' => ["code" => 500, "message" => "Media not found: " . $page_id]);
                //     $response->setStatusCode(500);
                //     $response->setContent(json_encode($error));
                //     $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                //     return $response;
                // }
            } else {
                $error = array('error' => ["code" => 500, "message" => "Invalid request"]);
                $response->setStatusCode(500);
                $response->setContent(json_encode($error));
                $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                return $response;
            }
        } else {
            throw new RuntimeException("Invalid Page");
        }

    }

    public function browseAction()
    {
        if ($this->currentSite()->slug() == "fashioncalendar") {
            $response = $this->getResponse();
            $params = $this->params()->fromQuery();
            if (array_key_exists('type', $params) && ($type = $params['type']) && array_key_exists('number', $params) && ($number = $params['number']) && array_key_exists('collection', $params) && ($collection = $params['collection'])) {
                $api = $this->plugin('api');
                $dateProperty = $api->searchOne('properties', ['term' => 'dcterms:date'])->getContent();
                switch ($type) {
                    case 'decade':
                        $data = [];
                        for ($i = 0; $i < 10; $i++) {
                            $item = $api->searchOne('items', [
                                'item_set_id' => $collection,
                                'property' => [
                                    [
                                        'property' => $dateProperty->id(),
                                        'type' => 'sw',
                                        'text' => $number + $i,
                                    ],
                                ],
                            ])->getContent();
                            if ($item) {
                                $primaryMedia = $item->primaryMedia();
                                if ($primaryMedia && ($primaryMedia->ingester() == 'remoteFile') && ($thumbnailURL = $primaryMedia->mediaData()['thumbnail'])) {
                                    $data[] = ['time' => $number + $i, "thumbnail" => $thumbnailURL];
                                }
                            }
                        }
                        $response->setContent(json_encode($data));
                        $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                        return $response;
                    case 'year':
                        # code...
                        break;


                }
            }
            $error = array('error' => ["code" => 500, "message" => "Invalid request"]);
            $response->setStatusCode(500);
            $response->setContent(json_encode($error));
            $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
            return $response;

        } else {
            throw new RuntimeException("Invalid Page");
        }

    }
}