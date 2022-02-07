import { useState } from 'react';
import { GetStaticProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiUser } from 'react-icons/fi';

import { getPrismicClient } from '../services/prismic';

import Header from '../components/Header';
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatPostData = (post: any): Post => {
  return {
    uid: post.uid,
    first_publication_date: post.first_publication_date,
    data: {
      author: post.data.author[0].text || post.data.author,
      subtitle: post.data.subtitle[0].text || post.data.subtitle,
      title: post.data.title[0].text || post.data.title,
    },
  } as Post;
};

const Home: React.FC<HomeProps> = ({ postsPagination }: HomeProps) => {
  const { next_page, results } = postsPagination;
  const [posts, setPosts] = useState<Post[]>(results);
  const [nextPage, setNextPage] = useState<string>(next_page);
  const [loadingNextPage, setLoadingNextPage] = useState(false);

  const loadNextPage = async (): Promise<void> => {
    if (!nextPage || loadingNextPage) return;

    setLoadingNextPage(true);

    const nextPageResponse = await fetch(nextPage);

    try {
      const data = await (nextPageResponse.json() as Promise<PostPagination>);

      const newPosts = data.results.map((post: Post) => formatPostData(post));

      setNextPage(data.next_page);
      setPosts([...posts, ...newPosts]);
    } catch {
      // eslint-disable-next-line no-console
      console.error('Erro no fetch da API Prismic');
    } finally {
      setLoadingNextPage(false);
    }
  };

  return (
    <div className={`${commonStyles.container} ${styles.container}`}>
      <Head>
        <title>Home | spacetraveling</title>
      </Head>

      <main>
        <section>
          <Header />
        </section>

        <section>
          {posts &&
            posts.map(post => (
              <Link key={post.uid} href={`/post/${post.uid}`}>
                <a>
                  <strong className={styles.title}>{post.data.title}</strong>
                  <p className={styles.subTitle}>{post.data.subtitle}</p>
                  <div className={styles.informations}>
                    <FiCalendar size={20} />
                    <time>
                      {format(
                        new Date(post.first_publication_date),
                        'dd MMM u',
                        {
                          locale: ptBR,
                        }
                      )}
                    </time>
                    <FiUser size={20} />
                    <span>{post.data.author}</span>
                  </div>
                </a>
              </Link>
            ))}

          {!posts && <p>Nenhum post encontrado...</p>}
        </section>

        {nextPage && (
          <button
            type="button"
            className={styles.continueReading}
            onClick={loadNextPage}
          >
            {loadingNextPage ? 'Carregando...' : 'Carregar mais posts'}
          </button>
        )}
      </main>
    </div>
  );
};

export default Home;

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    { pageSize: 2 }
  );

  const posts = response.results.map(post => {
    return formatPostData(post);
  });

  const postsPagination: PostPagination = {
    next_page: response.next_page,
    results: posts,
  };

  return {
    props: {
      postsPagination,
    },
  };
};
