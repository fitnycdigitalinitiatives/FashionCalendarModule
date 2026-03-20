<?php

namespace FashionCalendarModule\Service\Controller;

use Interop\Container\ContainerInterface;
use FashionCalendarModule\Controller\DataAtlasController;
use Laminas\ServiceManager\Factory\FactoryInterface;

class DataAtlasControllerFactory implements FactoryInterface
{
    public function __invoke(ContainerInterface $services, $requestedName, array $options = null)
    {
        return new DataAtlasController(
            $services->get('Omeka\AuthenticationService')
        );
    }
}
