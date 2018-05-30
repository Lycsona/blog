<?php

namespace App\BlogBundle\Service\Impl;

use App\BlogBundle\AppBlogBundleEvents;
use App\BlogBundle\DTO\ArticleDTO;
use App\BlogBundle\Entity\Article;
use App\BlogBundle\Entity\Tag;
use App\BlogBundle\Event\ApiExceptionEvent;
use App\BlogBundle\Factory\ModelFactory;
use App\BlogBundle\Form\ArticleType;
use App\BlogBundle\Service\ArticlesService;
use App\BlogBundle\Service\CacheService;
use App\BlogBundle\Service\FileUploader;
use App\BlogBundle\Service\PaginatorService;
use Doctrine\ORM\EntityManager;
use Symfony\Component\Form\FormFactory;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Debug\TraceableEventDispatcher;
use Symfony\Component\Serializer\Serializer;
use Symfony\Component\Validator\Validator\ValidatorInterface;

class ArticleServiceImpl implements ArticlesService
{
    private $em;

    private $pagination;

    private $cache;

    private $formFactory;

    private $dispatcher;

    private $serializer;

    private $fileUploader;

    private $validator;

    public function __construct(
        EntityManager $em,
        PaginatorService $pagination,
        CacheService $cache,
        FormFactory $formFactory,
        TraceableEventDispatcher $dispatcher,
        Serializer $serializer,
        FileUploader $fileUploader,
        ValidatorInterface $validator
    )
    {
        $this->em = $em;
        $this->pagination = $pagination;
        $this->cache = $cache;
        $this->formFactory = $formFactory;
        $this->dispatcher = $dispatcher;
        $this->serializer = $serializer;
        $this->fileUploader = $fileUploader;
        $this->validator = $validator;
    }

    public function getArticles($page, $size)
    {
        $cachedArticles = $this->getArticlesFromCache();
        if (!empty($cachedArticles)) {
            $articles = $this->getArticlesWithPaginationFromCache($page, $size);
        } else {
            $articles = $this->getArticlesWithPagination($page, $size);

            $this->createCacheArticles();
        }
        $articlesJson = $this->serializer->serialize($articles['result'], 'json');

        return new JsonResponse([
            'articles' => json_decode($articlesJson),
            'totalPages' => $articles['totalPages'],
            'firstPage' => $articles['firstPage'],
            'lastPage' => $articles['lastPage'],
        ], Response::HTTP_OK);
    }

    public function getArticleById($id)
    {
        $article = $this->em->getRepository(Article::class)->find($id);
        if (!$article) {
            return $this->getException(Response::HTTP_NOT_FOUND, AppBlogBundleEvents::GET_ENTITY_ERROR, ['id' => $id]);
        }

        $articleJson = $this->serializer->serialize($article, 'json');

        return JsonResponse::fromJsonString($articleJson, Response::HTTP_OK);
    }

    public function createArticle($request)
    {
        $data = $request->request->all();
        $data['image'] = is_array($data['image']) ? $this->fileUploader->upload($data['image']) : '';
        $data['tags'] = $this->em->getRepository(Tag::class)->findBy(['id' => $data['tags']]);

        $articleDTO = (new ArticleDTO())->build($data);

        $article = ModelFactory::createArticle($articleDTO);

        $errors = $this->validator->validate($article);
        if (count($errors) > 0) {
            return $this->getException(Response::HTTP_BAD_REQUEST, AppBlogBundleEvents::CREATE_ENTITY_ERROR, ['errors' => $errors]);
        }

        $this->em->persist($article);
        $this->em->flush();


        return JsonResponse::create(['message' => sprintf('Article created.')], Response::HTTP_CREATED);
    }

    public function editArticle($request, $id)
    {
        $article = $this->em->getRepository(Article::class)->find($id);
        if (!$article) {
            return $this->getException(Response::HTTP_NOT_FOUND, AppBlogBundleEvents::GET_ENTITY_ERROR, ['id' => $id]);
        }

        $oldImage = $article->getImage();

        $params = $request->request->all();
        $tags = $request->request->get('tags');
        unset($params['tags']);

        $form = $this->formFactory->create(ArticleType::class, $article, array('method' => 'POST'));
        $form->submit($params);
        if ($form->isValid()) {

            $article->setUpdatedAt(new \DateTime());

            $newImage = $form->getData()->getImage();
            if ($newImage && is_array($newImage)) {
                $this->fileUploader->delete($oldImage);
                $uploadedFile = $this->fileUploader->upload($newImage);
                $article->setImage($uploadedFile);
            }

            $article->removeTags();
            foreach ($tags as $tag) {
                $tagEntity = $this->em->getRepository(Tag::class)->findOneBy(['id' => $tag['id']]);
                $article->addTag($tagEntity);
            }

            $this->em->persist($article);
            $this->em->flush();

            $this->cache->deleteArticles();
            $this->createCacheArticles();

            return JsonResponse::create(['message' => sprintf('Article updated.')], Response::HTTP_OK);
        }

        return $this->getException(Response::HTTP_BAD_REQUEST, AppBlogBundleEvents::UPDATE_ENTITY_ERROR, ['errors' => $form]);
    }

    public function deleteArticle($id)
    {
        $article = $this->em->getRepository(Article::class)->find($id);
        if (!$article) {
            return $this->getException(Response::HTTP_NOT_FOUND, AppBlogBundleEvents::GET_ENTITY_ERROR, ['id' => $id]);
        }

        $this->em->remove($article);
        $this->em->flush();

        $this->cache->deleteArticles();
        $this->createCacheArticles();

        return JsonResponse::create(['message' => sprintf('Article deleted.'), Response::HTTP_OK]);
    }

    public function getArticlesByTag($tag)
    {
        $articles = $this->em->getRepository(Article::class)->selectAllArticlesByTag($tag);
        $articlesJson = $this->serializer->serialize($articles, 'json');

        return JsonResponse::fromJsonString($articlesJson, Response::HTTP_OK);
    }

    public function getArticlesFromDB()
    {
        return $this->em->getRepository(Article::class)->selectAllArticles();
    }

    public function getArticlesFromCache()
    {
        $articles = null;

        $cachedArticles = $this->cache->getAllArticles();
        if ($this->cache->hasCache($cachedArticles)) {
            $articles = $this->getArticlesTagsFromCache($this->cache->getValue($cachedArticles));
        }

        return $articles;
    }

    public function getArticlesTagsFromCache($articles)
    {
        return $this->cache->getArticlesWithTags($articles);
    }

    public function getArticlesWithPagination($page, $size)
    {
        return $this->pagination->paginate($this->getArticlesFromDB(), $page, $size);
    }

    public function getArticlesWithPaginationFromCache($page, $size)
    {
        return $this->pagination->paginate($this->getArticlesFromCache(), $page, $size);
    }

    public function createCacheArticles()
    {
        $this->cache->saveArticles($this->getArticlesFromDB());
    }

    public function getException($statusCode, $eventName, $param)
    {
        $event = new ApiExceptionEvent($statusCode, $param);
        $this->dispatcher->dispatch($eventName, $event);

        return $event->getResponse();
    }
}