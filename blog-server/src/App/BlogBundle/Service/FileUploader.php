<?php

namespace App\BlogBundle\Service;

interface FileUploader
{
    public function upload($file);

    public function delete($fileName);
}