import React from 'react';
import Image from 'next/image';

type IconComponentProps = {
  mainImagePath: string;
  overlayImagePath?: string;
};

export const Icon: React.FC<IconComponentProps> = ({ mainImagePath, overlayImagePath }) => {
  return (
    <div className="relative mr-2">
      <Image src={mainImagePath} alt="Main" width={48} height={48} />
      {overlayImagePath && (
        <div
          className="relative translate-x-8 -translate-y-5" // bottom-10 left-5 m-4
          style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'white' }}
        >
          <Image
            src={overlayImagePath}
            alt="Overlay"
            className='relative translate-x-1.5 translate-y-1'
            // className="relative bottom-10 left-5 m-4"
            style={{ objectFit: 'cover' }}
            width={10}
            height={10}
          />
        </div>
      )}
    </div>
  );
};

export default Icon;
