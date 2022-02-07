/* eslint-disable react/no-danger */
/* eslint-disable no-param-reassign */
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { getPrismicClient } from '../../services/prismic';

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

const PostPage: React.FC<PostProps> = ({ post }: PostProps) => {
  const router = useRouter();

  if (router.isFallback) {
    return <h2>Carregando...</h2>;
  }

  const totalWords = post.data.content.reduce<number>((total, content) => {
    total += content?.heading?.split(' ')?.length || 0;
    total += RichText.asText(content?.body)?.split(' ')?.length || 0;

    return total;
  }, 0);

  const readAverage = Math.ceil(totalWords / 200);

  return (
    <div className={`${commonStyles.container} ${styles.container}`}>
      <Head>
        <title>Post | spacetraveling</title>
      </Head>

      <main>
        <section>
          <Header />
        </section>

        <img src={post.data.banner.url} alt="banner" />

        <section>
          <strong className={styles.title}>{post.data.title}</strong>

          <div className={styles.informations}>
            <span>
              <FiCalendar size={20} />
              <time>
                {format(new Date(post.first_publication_date), 'dd MMM u', {
                  locale: ptBR,
                })}
              </time>
            </span>
            <span>
              <FiUser size={20} />
              <span>{post.data.author}</span>
            </span>
            <span>
              <FiClock size={20} />
              <time>{readAverage} min</time>
            </span>
          </div>
        </section>

        <section>
          {post.data.content.map(content => (
            <article key={content.heading}>
              <strong className={styles.heading}>{content.heading}</strong>
              <div
                className={styles.content}
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
            </article>
          ))}
        </section>
      </main>
    </div>
  );
};

export default PostPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();

  const posts = await prismic.query([
    Prismic.predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title[0].text || response.data.title,
      subtitle: response.data.subtitle[0].text || response.data.subtitle,
      author: response.data.author[0].text || response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading[0].text || content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
  };
};
