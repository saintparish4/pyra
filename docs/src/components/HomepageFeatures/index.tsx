import type {ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type Section = {
  title: string;
  to: string;
  description: ReactNode;
};

const SECTIONS: Section[] = [
  {
    title: 'Introduction',
    to: '/docs/intro',
    description: (
      <>
        What Pyra is, what runs today, and what is still blocked on the NERIS
        data dictionary.
      </>
    ),
  },
  {
    title: 'Deploy',
    to: '/docs/deploy',
    description: (
      <>
        Self-host the whole thing with Docker Compose — Postgres, MinIO, the
        API, and the web app behind one origin.
      </>
    ),
  },
  {
    title: 'Admin',
    to: '/docs/admin',
    description: (
      <>
        Departments, members, and roles. Accounts are provisioned, never
        self-serve, so tenancy holds.
      </>
    ),
  },
  {
    title: 'Import',
    to: '/docs/import',
    description: (
      <>
        Bring twenty years of history in from NFIRS flat files and vendor
        exports. The reason leaving a vendor is possible.
      </>
    ),
  },
  {
    title: 'Schema',
    to: '/docs/schema',
    description: (
      <>
        Pyra&apos;s own tables, the shared validators, and how the NERIS
        dictionary will map onto them.
      </>
    ),
  },
  {
    title: 'ADRs',
    to: '/docs/adr',
    description: (
      <>
        The architecture decisions behind the stack, the risks accepted
        knowingly, and what would reverse them.
      </>
    ),
  },
];

function SectionCard({title, to, description}: Section) {
  return (
    <Link to={to} className={styles.card}>
      <Heading as="h2" className={styles.cardTitle}>
        {title}
      </Heading>
      <p className={styles.cardBody}>{description}</p>
    </Link>
  );
}

export default function HomepageSections(): ReactNode {
  return (
    <section className={styles.sections}>
      <div className="container">
        <div className={styles.grid}>
          {SECTIONS.map((section) => (
            <SectionCard key={section.to} {...section} />
          ))}
        </div>
      </div>
    </section>
  );
}
