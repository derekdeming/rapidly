// import { LandingContent } from '@/components/landing/content';
// import { LandingHero } from '@/components/landing/hero';
// import { LandingNavbar } from '@/components/landing/navbar';
import styles from './index.module.css';
import Image from 'next/image';

import { WaitlistEmailSignup } from '@/components/waitlist-email-signup';

const LandingPage = () => {
  return (
    <>
      {/* <NavBar /> */}
      <div className={` h-screen w-screen flex flex-col ${styles.mainContainer}`}>
        <div className={styles.heroContainer}>
          <div className={styles.brandName}>Rapidly</div>
          <div className={styles.tagline}>
            Unleashing Insights, Unifying Minds: Your Company&apos;s Entire Knowledge Basis Made
            Readily Accessible.
          </div>
          <div className={styles.subhead}>
            Your company&apos;s knowledge base, accessible from one place.
          </div>
          <div style={{ margin: '32px auto', width: 'fit-content' }}>
            <div className={styles.usersText}>
              Join John, Robert, and 2415 others on the waitlist.
            </div>
            <div className="py-1" />
            {/* <div className="font-semibold pb-2">Join John, Robert and 2415 others on the waitlist.</div> */}
            <WaitlistEmailSignup />
            {/* <Button style={{ padding: '12px 16px' }}>Join the waitlist</Button> */}
          </div>
          {/* <div className={styles.avatarGroup}>
            <Image
              src="/images/avatar1.png"
              width={32}
              height={32}
              alt="avatar"
              className={styles.avatar}
              style={{ marginLeft: 0 }}
            />
            <Image
              src="/images/avatar2.png"
              width={32}
              height={32}
              alt="avatar"
              className={styles.avatar}
            />
            <Image
              src="/images/avatar3.png"
              width={32}
              height={32}
              alt="avatar"
              className={styles.avatar}
            />
            <Image
              src="/images/avatar4.png"
              width={32}
              height={32}
              alt="avatar"
              className={styles.avatar}
            />
            <Image
              src="/images/avatar5.png"
              width={32}
              height={32}
              alt="avatar"
              className={styles.avatar}
            />
          </div>
          <div className={styles.usersText}>Over 1k happy users</div> */}
        </div>
        <div className={styles.tagline}>Turbocharge your productivity with Rapidly Search</div>
        <div className={styles.subhead2}>
          {/* write subheading about features of natural language/sentiment search which is more advanced than keyword search */}
        </div>
        <div className="flex justify-center items-center min-h-screen">
  <div className="relative" style={{ width: '854px', height: '480px',  }}>
    <iframe
      className="absolute top-0 left-0 w-full h-full"
      src="https://www.youtube.com/embed/2iP8jCxJ5p0?si=xTx7RYb6q8QHVVgX"
      title="YouTube video player"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      frameBorder="0"
    ></iframe>
  </div>
</div>

        {/* <Image
          src="/images/browser.png"
          alt="browser"
          width={1012}
          height={668}
          className={styles.image}
        /> */}
        <div className={styles.featuresContainer}>
          <div className={styles.featureBox}>
            <Image src="/images/chat.png" alt="chat" width={48} height={48} />
            <div className={styles.featureName}>Custom Chat Agents</div>
            <div className={styles.featureText}>
              Use our most advanced AI chatbots to extract and transform your information into
              digestible insights. Customizable agents and support for BYOM (Bring your own model).
            </div>
          </div>
          <div className={styles.featureBox}>
            <Image src="/images/share.png" alt="share" width={48} height={48} />
            <div className={styles.featureName}>Cross Team Collaboration</div>
            <div className={styles.featureText}>
              Enhance productivity and harness the potential of seamless collaboration, whether
              it&apos;s within your team or extending company-wide, all while prioritizing security.
            </div>
          </div>
          <div className={styles.featureBox}>
            <Image src="/images/dev.png" alt="dev" width={48} height={48} />
            <div className={styles.featureName}>Streamlined Integrations</div>
            <div className={styles.featureText}>
              Achieve effortless connectivity by simply clicking to link our search feature with all
              your current tools, such as Slack, Notion, Google Drive, and beyond!
            </div>
          </div>
        </div>
        <div className={styles.joinContainer}>
          <div className={styles.tagline}>Ready to turbocharge your productivity with Rapidly?</div>
          <WaitlistEmailSignup />
          {/* <Button style={{ padding: '12px 16px' }}>Join our waitlist!</Button> */}
        </div>
      </div>
    </>
  );
};

export default LandingPage;
