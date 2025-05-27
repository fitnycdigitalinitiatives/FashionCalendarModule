<?php

/**
 * FashionCalendarModule
 */

namespace FashionCalendarModule;

use Omeka\Module\AbstractModule;
use Laminas\Mvc\MvcEvent;
use Laminas\View\Renderer\PhpRenderer;
use Laminas\Mvc\Controller\AbstractController;
use Laminas\ModuleManager\ModuleManager;
use Laminas\EventManager\Event;
use Laminas\EventManager\SharedEventManagerInterface;
use FashionCalendarModule\Form\ConfigForm;

class Module extends AbstractModule
{
    /** Module body **/

    /** Load AWS SDK **/
    public function init(ModuleManager $moduleManager)
    {
        require_once __DIR__ . '/vendor/autoload.php';
    }
    /**
     * Get this module's configuration array.
     *
     * @return array
     */
    public function getConfig()
    {
        return include __DIR__ . '/config/module.config.php';
    }
    public function onBootstrap(MvcEvent $event)
    {
        parent::onBootstrap($event);

        $acl = $this->getServiceLocator()->get('Omeka\Acl');
        $acl->allow(
            null,
            [
                'FashionCalendarModule\Controller\Data',
                'FashionCalendarModule\Controller\DataAtlas',
            ]
        );
    }

    public function getConfigForm(PhpRenderer $renderer)
    {
        $settings = $this->getServiceLocator()->get('Omeka\Settings');
        $form = new ConfigForm;
        $form->init();
        $form->setData([
            'mongo_connection' => $settings->get('fcm_mongo_connection'),
            'mongo_connection_format' => $settings->get('fcm_mongo_connection_format'),
            'mongo_url' => $settings->get('fcm_mongo_url'),
            'mongo_user' => $settings->get('fcm_mongo_user'),
            'mongo_password' => $settings->get('fcm_mongo_password'),
            'mongo_db' => $settings->get('fcm_mongo_db'),
            'solr_hostname' => $settings->get('fcm_solr_hostname'),
            'solr_port' => $settings->get('fcm_solr_port'),
            'solr_path' => $settings->get('fcm_solr_path'),
            'solr_connection' => $settings->get('fcm_solr_connection'),
            'solr_login' => $settings->get('fcm_solr_login'),
            'solr_password' => $settings->get('fcm_solr_password'),
        ]);
        return $renderer->formCollection($form);
    }

    public function handleConfigForm(AbstractController $controller)
    {
        $settings = $this->getServiceLocator()->get('Omeka\Settings');
        $form = new ConfigForm;
        $form->init();
        $form->setData($controller->params()->fromPost());
        if (!$form->isValid()) {
            $controller->messenger()->addErrors($form->getMessages());
            return false;
        }
        $formData = $form->getData();
        $settings->set('fcm_mongo_connection', $formData['mongo_connection']);
        $settings->set('fcm_mongo_connection_format', $formData['mongo_connection_format']);
        $settings->set('fcm_mongo_url', $formData['mongo_url']);
        $settings->set('fcm_mongo_user', $formData['mongo_user']);
        $settings->set('fcm_mongo_password', $formData['mongo_password']);
        $settings->set('fcm_mongo_db', $formData['mongo_db']);
        $settings->set('fcm_solr_hostname', $formData['solr_hostname']);
        $settings->set('fcm_solr_port', $formData['solr_port']);
        $settings->set('fcm_solr_path', $formData['solr_path']);
        $settings->set('fcm_solr_connection', $formData['solr_connection']);
        $settings->set('fcm_solr_login', $formData['solr_login']);
        $settings->set('fcm_solr_password', $formData['solr_password']);
        return true;
    }
}
