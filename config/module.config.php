<?php

namespace FashionCalendarModule;

return [
    'controllers' => [
        'factories' => [
            'FashionCalendarModule\Controller\DataAtlas' => Service\Controller\DataAtlasControllerFactory::class,
        ],
    ],
    'block_layouts' => [
        'invokables' => [
            'dataTable' => Site\BlockLayout\FashionCalendarData::class,
            'fashionBrowse' => Site\BlockLayout\FashionCalendarBrowse::class,
            'fashionHome' => Site\BlockLayout\FashionCalendarHome::class,
            'fashionArchives' => Site\BlockLayout\FashionCalendarArchives::class,
        ],
    ],
    'router' => [
        'routes' => [
            'site' => [
                'child_routes' => [
                    // 'data-api' => [
                    //     'type' => 'Segment',
                    //     'options' => [
                    //         'route' => '/data-api/:action',
                    //         'defaults' => [
                    //             '__NAMESPACE__' => 'FashionCalendarModule\Controller',
                    //             'controller' => 'Data',
                    //             'action' => 'events',
                    //         ],
                    //     ],
                    //     'constraints' => [
                    //         'action' => '[a-zA-Z][a-zA-Z0-9_-]*',
                    //     ],
                    // ],
                    'data-altas-api' => [
                        'type' => 'Segment',
                        'options' => [
                            'route' => '/data-atlas-api/:action',
                            'defaults' => [
                                '__NAMESPACE__' => 'FashionCalendarModule\Controller',
                                'controller' => 'DataAtlas',
                                'action' => 'events',
                            ],
                        ],
                        'constraints' => [
                            'action' => '[a-zA-Z][a-zA-Z0-9_-]*',
                        ],
                    ],
                    'data-page' => [
                        'type' => 'Segment',
                        'options' => [
                            'route' => '/page/data',
                            'defaults' => [
                                '__NAMESPACE__' => 'FashionCalendarModule\Controller',
                                'controller' => 'DataAtlas',
                                'action' => 'index',
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ],
    'view_manager' => [
        'template_path_stack' => [
            dirname(__DIR__) . '/view',
        ],
    ],
];
