<?php
namespace FashionCalendarModule;

return [
    'controllers' => [
        'invokables' => [
            'FashionCalendarModule\Controller\Data' => Controller\DataController::class,
        ]
    ],
    'block_layouts' => [
        'invokables' => [
            'dataTable' => Site\BlockLayout\FashionCalendarData::class,
            'fashionBrowse' => Site\BlockLayout\FashionCalendarBrowse::class,
        ],
    ],
    'router' => [
        'routes' => [
            'site' => [
                'child_routes' => [
                    'data-api' => [
                        'type' => 'Segment',
                        'options' => [
                            'route' => '/data-api/:action',
                            'defaults' => [
                                '__NAMESPACE__' => 'FashionCalendarModule\Controller',
                                'controller' => 'Data',
                                'action' => 'events',
                            ],
                        ],
                        'constraints' => [
                            'action' => '[a-zA-Z][a-zA-Z0-9_-]*',
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