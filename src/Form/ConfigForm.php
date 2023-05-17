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
    }
}