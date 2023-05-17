<?php
namespace FashionCalendarModule;

return [
    'controllers' => [
        'invokables' => [
            'FashionCalendarModule\Controller\Index' => Controller\IndexController::class,
        ]
    ],
    'router' => [
        'routes' => [
            'site' => [
                'child_routes' => [
                    'fc-search' => [
                        'type' => 'Segment',
                        'options' => [
                            'route' => '/fc-search',
                            'defaults' => [
                                '__NAMESPACE__' => 'FashionCalendarModule\Controller',
                                'controller' => 'Index',
                                'action' => 'search',
                            ],
                        ],
                    ],
                ],
            ],
        ],
    ],
];