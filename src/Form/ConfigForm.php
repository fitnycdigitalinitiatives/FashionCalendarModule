<?php
namespace FashionCalendarModule\Form;

use Laminas\Form\Form;
use Laminas\Form\Element;

class ConfigForm extends Form
{
    public function init()
    {
        $this->add([
            'name' => 'mongo_connection',
            'type' => Element\Checkbox::class,
            'options' => [
                'label' => 'Activate connection to MongoDb',
                // @translate
            ],
            'attributes' => [
                'id' => 'mongo_connection',
            ],
        ]);
        $this->add([
            'name' => 'mongo_connection_format',
            'type' => Element\Radio::class,
            'options' => [
                'label' => 'MongoDB Connection Format',
                'value_options' => [
                    'mongodb' => 'mongodb',
                    'mongodb+srv' => 'mongodb+srv',
                ],
                // @translate
            ],
            'attributes' => [
                'id' => 'mongo_connection_format',
            ],
        ]);
        $this->add([
            'name' => 'mongo_url',
            'type' => Element\Text::class,
            'options' => [
                'label' => 'URL endpoint for MongoDB',
                // @translate
            ],
            'attributes' => [
                'id' => 'mongo_url',
            ],
        ]);
        $this->add([
            'name' => 'mongo_user',
            'type' => Element\Text::class,
            'options' => [
                'label' => 'MongoDB username',
                // @translate
            ],
            'attributes' => [
                'id' => 'mongo_user',
            ],
        ]);
        $this->add([
            'name' => 'mongo_password',
            'type' => Element\Text::class,
            'options' => [
                'label' => 'MongoDB password',
                // @translate
            ],
            'attributes' => [
                'id' => 'mongo_password',
            ],
        ]);
        $this->add([
            'name' => 'mongo_db',
            'type' => Element\Text::class,
            'options' => [
                'label' => 'MongoDB Database Name',
                // @translate
            ],
            'attributes' => [
                'id' => 'mongo_db',
            ],
        ]);
        $this->add([
            'name' => 'solr_hostname',
            'type' => 'Text',
            'options' => [
                'label' => 'Solr Hostname',
            ],
            'attributes' => [
                'id' => 'solr_hostname',
            ],
        ]);
        $this->add([
            'name' => 'solr_port',
            'type' => 'Text',
            'options' => [
                'label' => 'Solr Port',
            ],
            'attributes' => [
                'id' => 'solr_port',
            ],
        ]);
        $this->add([
            'name' => 'solr_path',
            'type' => 'Text',
            'options' => [
                'label' => 'Solr Path',
            ],
            'attributes' => [
                'id' => 'solr_path',
            ],
        ]);
        $this->add([
            'name' => 'solr_connection',
            'type' => Element\Checkbox::class,
            'options' => [
                'label' => 'Activate connection to Solr',
                // @translate
            ],
            'attributes' => [
                'id' => 'solr_connection',
            ],
        ]);
        $this->add([
            'name' => 'solr_login',
            'type' => Element\Text::class,
            'options' => [
                'label' => 'Solr username',
                // @translate
            ],
            'attributes' => [
                'id' => 'solr_login',
            ],
        ]);
        $this->add([
            'name' => 'solr_password',
            'type' => Element\Text::class,
            'options' => [
                'label' => 'Solr password',
                // @translate
            ],
            'attributes' => [
                'id' => 'solr_password',
            ],
        ]);
    }
}