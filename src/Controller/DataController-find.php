<?php

namespace FashionCalendarModule\Controller;

use Laminas\Mvc\Controller\AbstractActionController;
use Exception;
use MongoDB\Client;
use MongoDB\Driver\ServerApi;

class DataController extends AbstractActionController
{
    public function eventsAction()
    {
        if ($this->currentSite()->slug() == "fashioncalendar") {
            $response = $this->getResponse();
            $settings = $this->settings();
            $uri = "mongodb+srv://" . $settings->get('fcm_mongo_user') . ":" . $settings->get('fcm_mongo_password') . "@" . $settings->get('fcm_mongo_url') . "/?retryWrites=true&w=majority";
            // Specify Stable API version 1
            $apiVersion = new ServerApi(ServerApi::V1);
            // Create a new client and connect to the server
            $client = new Client($uri, [], ['serverApi' => $apiVersion]);
            $params = $this->params()->fromQuery();
            $docs_per_page = 50;
            $collection = $client->selectCollection('fashion-calendar', 'events');
            if (array_key_exists('page', $params) && ($page = $params['page']) && is_numeric($page)) {
                $skip = $docs_per_page * ($page - 1);
            } else {
                $skip = 0;
            }
            $options = [
                'skip' => $skip,
                'limit' => $docs_per_page
            ];

            $filter = [];
            if (array_key_exists('text', $params) && ($text = $params['text'])) {
                $filter = ['$text' => ['$search' => $text, '$language' => 'en']];
                $options['sort'] = ['score' => ['$meta' => 'textScore'], '_id' => 1];
            }
            if (array_key_exists('names', $params) && ($names = $params['names'])) {
                $filter['names.label'] = $names;
            }
            if (array_key_exists('categories', $params) && ($categories = $params['categories'])) {
                $filter['names.categories.label'] = $categories;
            }
            if (array_key_exists('issue', $params) && ($issue = $params['issue'])) {
                $filter['appears_in.calendar_id'] = $issue;
            }
            if (array_key_exists('location', $params) && ($location = $params['location'])) {
                $maxDistance = 0;
                if (array_key_exists('max_distance', $params) && ($max_distance = $params['max_distance']) && is_numeric($max_distance)) {
                    $maxDistance = $max_distance;
                }
                $filter['location'] = [
                    '$near' => ['$geometry' => ['type' => 'Point', 'coordinates' => json_decode('[' . $location . ']', true)], '$maxDistance' => $maxDistance]
                ];
            }

            try {
                $cursor = $collection->find($filter, $options);
                $count = $collection->countDocuments($filter);
                $response->setContent(json_encode($cursor->toArray()));
                $response->getHeaders()->addHeaderLine('fashion-calendar-total-results', $count);
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
                // $item = $api->searchOne('items', [
                //     'property' => [
                //         [
                //             'property' => $identifier->id(),
                //             'type' => 'eq',
                //             'text' => $id,
                //         ],
                //     ],
                // ])->getContent();
                // if ($item && ($media = $item->media()) && isset($media[$page])) {
                //     $media = $item->media();
                //     $response->setContent(json_encode([
                //         'html' => $media[$page]->render(),
                //         'item-link' => $item->siteUrl(),
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

                // If using this method be sure query is not slowed down by resource link subquery
                $media = $api->searchOne('media', [
                    'property' => [
                        [
                            'property' => $identifier->id(),
                            'type' => 'eq',
                            'text' => $page_id,
                        ],
                    ],
                ])->getContent();
                if ($media) {
                    $response->setContent(json_encode([
                        'html' => $media->render(),
                        'item-link' => $media->item()->siteUrl(),
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
}