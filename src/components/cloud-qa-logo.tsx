import Image from 'next/image';
import * as React from 'react';

export const CloudQaLogo = (props: { className?: string }) => (
  <Image
    src="https://d1ax5wqehib729.cloudfront.net/wp-content/uploads/2015/10/27073016/195x40trns.png"
    alt="CloudQA Logo"
    width={195}
    height={40}
    className={props.className}
    priority
  />
);
