import Link from 'next/link';

const Header: React.FC = () => {
  return (
    <>
      <Link href="/">
        <img src="/images/logo.svg" alt="logo" />
      </Link>
    </>
  );
};

export default Header;
