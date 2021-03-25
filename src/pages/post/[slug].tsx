import { GetStaticPaths, GetStaticProps } from 'next';
import { useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { getPrismicClient } from '../../services/prismic';

import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Header from '../../components/Header';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();
  const estimatedReadTime = useMemo(() => {
    if (router.isFallback) {
      return 0;
    }

    const wordsPerMinute = 200;

    const contentWords = post.data.content.reduce(
      (summedContents, currentContent) => {
        const headingWords = currentContent.heading.split(/\s/g).length;
        const bodyWords = currentContent.body.reduce(
          (summedBodies, currentBody) => {
            const textWords = currentBody.text.split(/\s/g).length;

            return summedBodies + textWords;
          },
          0
        );

        return summedContents + headingWords + bodyWords;
      },
      0
    );

    const minutes = contentWords / wordsPerMinute;
    const readTime = Math.ceil(minutes);

    return readTime;
  }, [post, router.isFallback]);

  return (
    <>
      <Head>
        <title>Post | spacetraveling</title>
      </Head>

      <main>
        <Header />

        {router.isFallback ? (
          <h2>Carregando...</h2>
        ) : (
          <article className={styles.post}>
            <figure>
              <img src={post.data.banner.url} alt={post.data.title} />
            </figure>

            <div className={commonStyles.container}>
              <h1>{post.data.title}</h1>

              <ul className={styles.postInfo}>
                <li>
                  <FiCalendar />
                  {format(new Date(post.first_publication_date), 'd MMM y', {
                    locale: ptBR,
                  })}
                </li>
                <li>
                  <FiUser />
                  {post.data.author}
                </li>
                <li>
                  <FiClock />
                  {estimatedReadTime} min
                </li>
              </ul>

              {post.data.content.map((content, index) => (
                <div key={index} className={styles.postContent}>
                  <h2>{content.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(content.body),
                    }}
                  />
                </div>
              ))}
            </div>
          </article>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'post'),
  ]);

  const post = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: post,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('post', String(slug), {});

  return {
    props: {
      post: response,
    },
    revalidate: 60 * 60, // 1 hora
  };
};
