import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { useState } from 'react';
import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<Post[]>(postsPagination.results);
  const [hasMore, setHasMore] = useState(!!postsPagination.next_page);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);

  async function handleLoadMore() {
    const responseLoadMore = await fetch(nextPage).then(result =>
      result.json()
    );

    setPosts([...posts, ...responseLoadMore.results]);
    setHasMore(!!responseLoadMore.next_page);
    setNextPage(responseLoadMore.next_page);
  }

  return (
    <>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <main className={commonStyles.container}>
        <div className={styles.mainContainer}>
          <img src="logo.svg" alt="logo" />

          <ul>
            {posts.map(post => (
              <li key={post.uid}>
                <Link href={`/post/${post.uid}`}>
                  <a>
                    <strong>{post.data.title}</strong>
                    <p>{post.data.subtitle}</p>
                    <div>
                      <span>
                        <FiCalendar />
                        {format(
                          new Date(post.first_publication_date),
                          'd MMM y',
                          {
                            locale: ptBR,
                          }
                        )}
                      </span>
                      <span>
                        <FiUser />
                        {post.data.author}
                      </span>
                    </div>
                  </a>
                </Link>
              </li>
            ))}
          </ul>

          {hasMore && (
            <button onClick={handleLoadMore}>Carregar mais posts</button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 20,
    }
  );

  const postsPagination = {
    next_page: postsResponse.next_page,
    results: postsResponse.results,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
