<?php

namespace FashionCalendarModule\Controller;

use Laminas\Mvc\Controller\AbstractActionController;
use Omeka\Mvc\Exception\RuntimeException;
use MongoDB\Client;
use MongoDB\Driver\ServerApi;
use MongoDB\BSON\UTCDateTime;
use MongoDB\BSON\Regex;

class DataController extends AbstractActionController
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
            $match = [];
            $geoNear = [];
            $hasText = false;
            if (array_key_exists('text', $params) && ($text = $params['text'])) {
                $match['$match']['$and'][] = ['$text' => ['$search' => $text, '$language' => 'en']];
                $hasText = true;
            }
            // Default sort
            $sort['$sort'] = ['start_date_iso' => 1, '_id' => 1];
            if (array_key_exists('sort', $params) && ($sortParam = $params['sort']) && (($sortParam == "asc") || ($sortParam == "desc") || ($sortParam == "text"))) {
                switch ($sortParam) {
                    case 'asc':
                        $sort['$sort'] = ['start_date_iso' => 1, '_id' => 1];
                        break;
                    case 'desc':
                        $sort['$sort'] = ['start_date_iso' => -1, '_id' => 1];
                        break;
                    case 'text':
                        if ($hasText) {
                            $sort['$sort'] = ['score' => ['$meta' => 'textScore'], '_id' => 1];
                        }
                        break;
                }
            } elseif ($hasText) {
                $sort['$sort'] = ['score' => ['$meta' => 'textScore'], '_id' => 1];
            }
            if (array_key_exists('names', $params) && ($names = $params['names'])) {
                $names = is_array($names) ? $names : [$names];
                foreach ($names as $name) {
                    $match['$match']['$and'][] = ['names.label' => $name];
                }
            }
            if (array_key_exists('adv_name', $params) && ($names = $params['adv_name'])) {
                $names = is_array($names) ? $names : [$names];
                //AND
                if (array_key_exists('adv_name_type', $params) && ($params['adv_name_type'] == "AND")) {
                    foreach ($names as $name) {
                        $match['$match']['$and'][] = ['names.label' => $name];
                    }
                }
                //OR
                else {
                    $orList = [];
                    foreach ($names as $name) {
                        $orList[] = ['names.label' => $name];
                    }
                    $match['$match']['$and'][] = ['$or' => $orList];
                }
            }

            if (array_key_exists('categories', $params) && ($categories = $params['categories'])) {
                $categories = is_array($categories) ? $categories : [$categories];
                foreach ($categories as $category) {
                    $match['$match']['$and'][] = ['names.categories.label' => $category];
                }
            }
            if (array_key_exists('adv_category', $params) && ($categories = $params['adv_category'])) {
                $categories = is_array($categories) ? $categories : [$categories];
                //AND
                if (array_key_exists('adv_category_type', $params) && ($params['adv_category_type'] == "AND")) {
                    foreach ($categories as $category) {
                        $match['$match']['$and'][] = ['names.categories.label' => $category];
                    }
                }
                //OR
                else {
                    $orList = [];
                    foreach ($categories as $category) {
                        $orList[] = ['names.categories.label' => $category];
                    }
                    $match['$match']['$and'][] = ['$or' => $orList];
                }
            }
            if (array_key_exists('issue', $params) && ($issue = $params['issue'])) {
                $match['$match']['$and'][] = ['appears_in.calendar_id' => $issue];
            }
            if (array_key_exists('titles', $params) && ($titles = $params['titles']) && (($titles == "Fashion Calendar") || ($titles == "Home Furnishings Calendar"))) {
                $match['$match']['$and'][] = ['appears_in.calendar_title' => $titles];
            }
            if (array_key_exists('year', $params) && ($year = $params['year']) && (strlen($year) == 4) && is_numeric($year)) {
                $match['$match']['$and'][] = ['start_date_iso' => ['$gte' => new UTCDateTime(strtotime($year . '-01-01') * 1000), '$lt' => new UTCDateTime(strtotime(strval($year + 1) . '-01-01') * 1000)]];
            }
            if (array_key_exists('date_range_start', $params) && array_key_exists('date_range_end', $params) && ($date_range_start = $params['date_range_start']) && ($date_range_end = $params['date_range_end']) && (strlen($date_range_start) == 4) && (strlen($date_range_end) == 4) && is_numeric($date_range_start) && is_numeric($date_range_end) && $date_range_start <= $date_range_end) {
                $match['$match']['$and'][] = ['start_date_iso' => ['$gte' => new UTCDateTime(strtotime($date_range_start . '-01-01') * 1000), '$lt' => new UTCDateTime(strtotime(strval($date_range_end + 1) . '-01-01') * 1000)]];
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
                    $match['$match']['$and'][] = ['start_date_iso' => ['$gte' => new UTCDateTime(strtotime($year_month) * 1000), '$lt' => new UTCDateTime(strtotime($end_year_month) * 1000)]];
                }
            }
            if (array_key_exists('location', $params) && ($location = $params['location'])) {
                $maxDistance = 0;
                if (array_key_exists('max_distance', $params) && ($max_distance = $params['max_distance']) && is_numeric($max_distance)) {
                    $maxDistance = floatval($max_distance);
                }
                // text and geoNear cannot be combined so need to do this workaround
                if ($hasText) {
                    $match['$match']['$and'][] = ['location' => ['$geoWithin' => ['$centerSphere' => [json_decode('[' . $location . ']', true), $maxDistance]]]];
                } else {
                    $geoNear['$geoNear'] = ['near' => ['type' => 'Point', 'coordinates' => json_decode('[' . $location . ']', true)], 'maxDistance' => $maxDistance, 'key' => 'location', 'distanceField' => 'distance'];
                }
            }
            $aggregation = [];
            if ($geoNear) {
                $aggregation[] = $geoNear;
            }
            if (array_key_exists('$match', $match) && array_key_exists('$and', $match['$match']) && $match['$match']['$and']) {
                $aggregation[] = $match;
            }
            // Check if graph data is all that is needed
            if (array_key_exists('graph', $params) && ($params['graph'] == 'true')) {
                $facet = [
                    '$facet' => [
                        'uniqueHostsbyYear' => [['$unwind' => ['path' => '$names']], ['$group' => ['_id' => ['$year' => '$start_date_iso'], 'names' => ['$addToSet' => '$names.label']]], ['$sort' => ['_id' => 1]], ['$project' => ['_id' => 0, 'year' => '$_id', 'numberOfHosts' => ['$size' => '$names']]]],
                        'names' => [['$unwind' => ['path' => '$names']], ['$group' => ['_id' => '$names.label', 'count' => ['$sum' => 1]]], ['$sort' => ['count' => -1]], ['$project' => ['_id' => 0, 'name' => '$_id', 'count' => 1]]],
                        'categories' => [['$project' => ['categories' => ['$reduce' => ['input' => '$names.categories.label', 'initialValue' => [], 'in' => ['$setUnion' => ['$$this', '$$value']]]]]], ['$unwind' => ['path' => '$categories']], ['$group' => ['_id' => '$categories', 'count' => ['$sum' => 1]]], ['$sort' => ['count' => -1]], ['$project' => ['_id' => 0, 'category' => '$_id', 'count' => 1]]],
                        'years' => [['$group' => ['_id' => ['$year' => '$start_date_iso'], 'count' => ['$sum' => 1]]], ['$sort' => ['_id' => 1]], ['$project' => ['_id' => 0, 'year' => '$_id', 'count' => 1]]]
                    ]
                ];
                if ($hasText) {
                    $regex = "\b" . preg_replace('/^(\'[^\']*\'|"[^"]*")$/', '$2$3', $text) . "\b";
                    $facet['$facet']['ngram'] = [['$addFields' => ['occurrences' => ['$regexFindAll' => ['input' => ['$concat' => ['$what', ' ', '$when', ' ', '$who', ' ', '$where', ' ', '$description']], 'regex' => new Regex($regex, "i")]]]], ['$unwind' => ['path' => '$occurrences']], ['$group' => ['_id' => ['$year' => '$start_date_iso'], 'count' => ['$sum' => 1]]], ['$sort' => ['_id' => 1]], ['$project' => ['_id' => 0, 'year' => '$_id', 'count' => 1]]];
                }
                $aggregation[] = $facet;
            } elseif (array_key_exists('map', $params) && ($params['map'] == 'true')) {
                if (array_key_exists('mappage', $params) && ($mappage = $params['mappage']) && is_numeric($mappage)) {
                    $skip = ['$skip' => $map_docs_per_page * ($mappage - 1)];
                } else {
                    $skip = ['$skip' => 0];
                }
                $limit = ['$limit' => $map_docs_per_page];
                $facet = [
                    '$facet' => [
                        'results' => [
                            $sort,
                            $skip,
                            $limit
                        ],
                        'count' => [
                            [
                                '$count' => 'count'
                            ]
                        ]
                    ]
                ];
                $aggregation[] = $facet;
                $aggregation[] = ['$project' => ['results' => 1, 'count' => ['$first' => '$count']]];
                $aggregation[] = ['$project' => ['results' => 1, 'count' => '$count.count']];
            } elseif (array_key_exists('facet', $params) && ($params['facet'] == 'true')) {
                $facet = [
                    '$facet' => [
                        'names' => [['$unwind' => ['path' => '$names']], ['$group' => ['_id' => '$names.label', 'count' => ['$sum' => 1]]], ['$sort' => ['count' => -1]], ['$limit' => 25], ['$project' => ['_id' => 0, 'name' => '$_id', 'count' => 1]]],
                        'categories' => [['$project' => ['categories' => ['$reduce' => ['input' => '$names.categories.label', 'initialValue' => [], 'in' => ['$setUnion' => ['$$this', '$$value']]]]]], ['$unwind' => ['path' => '$categories']], ['$group' => ['_id' => '$categories', 'count' => ['$sum' => 1]]], ['$sort' => ['count' => -1]], ['$limit' => 25], ['$project' => ['_id' => 0, 'category' => '$_id', 'count' => 1]]],
                        'years' => [['$group' => ['_id' => ['$year' => '$start_date_iso'], 'count' => ['$sum' => 1]]], ['$sort' => ['_id' => 1]], ['$project' => ['_id' => 0, 'year' => '$_id', 'count' => 1]]],
                        'titles' => [['$group' => ['_id' => ['$arrayElemAt' => ['$appears_in.calendar_title', 0]], 'count' => ['$sum' => 1]]], ['$sort' => ['count' => -1]], ['$project' => ['_id' => 0, 'title' => '$_id', 'count' => 1]]]
                    ]
                ];
                $aggregation[] = $facet;
            } elseif (array_key_exists('date_range', $params) && ($params['date_range'] == 'true')) {
                $aggregation[] = ['$group' => ['_id' => null, 'earliest' => ['$min' => '$start_date_iso'], 'latest' => ['$max' => '$start_date_iso']]];
                $aggregation[] = ['$project' => ['_id' => 0, 'earliest' => ['$year' => '$earliest'], 'latest' => ['$year' => '$latest']]];
            } elseif (array_key_exists('download', $params) && ($params['download'] == 'true')) {
                $aggregation[] = $sort;
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
                $facet = [
                    '$facet' => [
                        'results' => [
                            $sort,
                            $skip,
                            $limit
                        ],
                        'count' => [
                            [
                                '$count' => 'count'
                            ]
                        ]
                    ]
                ];
                $aggregation[] = $facet;
                $aggregation[] = ['$project' => ['results' => 1, 'count' => ['$first' => '$count']]];
                $aggregation[] = ['$project' => ['results' => 1, 'count' => '$count.count']];
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

    public function downloadAction()
    {
        if ($this->currentSite()->slug() == "fashioncalendar" && ($params = $this->params()->fromQuery()) && array_key_exists('id', $params) && ($id = $params['id']) && ($api = $this->api()) && ($item = $api->read('items', $id)->getContent()) && ($allmedia = $item->media())) {
            foreach ($allmedia as $media) {
                if ($media->mediaType() == "application/pdf") {
                    $presignedHelper = $this->viewHelpers()->get('s3presigned');
                    $accessURL = $media->mediaData()['access'];
                    $response = $this->getResponse();
                    $response->setContent(json_encode(['url' => $presignedHelper($accessURL, true)]));
                    $response->getHeaders()->addHeaderLine('Content-Type', 'application/json');
                    return $response;
                }
            }
        } else {
            throw new RuntimeException("Invalid Page");
        }


    }
}