<?php
/**
 * FashionCalendarModule
 */
namespace FashionCalendarModule;

use Omeka\Module\AbstractModule;
use Laminas\View\Renderer\PhpRenderer;
use Laminas\Mvc\Controller\AbstractController;
use Laminas\ModuleManager\ModuleManager;
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

    public function getConfigForm(PhpRenderer $renderer)
    {
        $settings = $this->getServiceLocator()->get('Omeka\Settings');
        $form = new ConfigForm;
        $form->init();
        $form->setData([
            'site' => $settings->get('fcm_site'),
            'mongo_connection' => $settings->get('fcm_mongo_connection'),
            'mongo_url' => $settings->get('fcm_mongo_url'),
            'mongo_user' => $settings->get('fcm_mongo_user'),
            'mongo_password' => $settings->get('fcm_mongo_password'),
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
        $settings->set('fcm_site', $formData['site']);
        $settings->set('fcm_mongo_connection', $formData['mongo_connection']);
        $settings->set('fcm_mongo_url', $formData['mongo_url']);
        $settings->set('fcm_mongo_user', $formData['mongo_user']);
        $settings->set('fcm_mongo_password', $formData['mongo_password']);
        return true;
    }
}