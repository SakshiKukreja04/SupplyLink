import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import leftPerson from '../assests/left.png';
import rightPerson from '../assests/right.png';

const DeliveryAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPersonRef = useRef<HTMLImageElement>(null);
  const rightPersonRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    console.log('DeliveryAnimation: useEffect triggered');
    console.log('Left person ref:', leftPersonRef.current);
    console.log('Right person ref:', rightPersonRef.current);
    console.log('Left person image:', leftPerson);
    console.log('Right person image:', rightPerson);

    // Wait for images to load
    const leftImg = leftPersonRef.current;
    const rightImg = rightPersonRef.current;

    if (!leftImg || !rightImg) {
      console.error('Image refs not found');
      return;
    }

    // Initial setup - hide images and set starting positions
    gsap.set(leftImg, {
      opacity: 0,
      x: -200,
      scale: 0.8
    });

    gsap.set(rightImg, {
      opacity: 0,
      x: 200,
      scale: 0.8
    });

    // Create the animation timeline
    const tl = gsap.timeline({
      delay: 1, // Start after 1 second
      ease: "power2.out"
    });

    // Animate left person sliding in from left
    tl.to(leftImg, {
      x: -30, // Much closer to center
      opacity: 1,
      scale: 1.4, // Bigger scale
      duration: 1.2,
      ease: "back.out(1.7)"
    }, 0);

    // Animate right person sliding in from right
    tl.to(rightImg, {
      x: 30, // Much closer to center
      opacity: 1,
      scale: 1.4, // Bigger scale
      duration: 1.2,
      ease: "back.out(1.7)"
    }, 0.3); // Slight delay for staggered effect

    // After both are in position, add a subtle bounce effect
    tl.to([leftImg, rightImg], {
      y: -20,
      duration: 0.6,
      ease: "power2.inOut",
      yoyo: true,
      repeat: 1
    }, 1.5);

    // Add a continuous gentle floating animation
    tl.to([leftImg, rightImg], {
      y: -10,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    }, 2.5);

    console.log('Animation timeline created');

    // Cleanup function
    return () => {
      console.log('Cleaning up animation');
      tl.kill();
    };
  }, []);

  return (
    <div className="w-full flex justify-center items-center py-8 relative z-50">
      {/* Delivery person (left) */}
      <div className="absolute left-1/4 top-1/2 transform -translate-y-1/2 z-50">
        <img
          ref={leftPersonRef}
          src={leftPerson}
          alt="Delivery Person"
          className="w-56 h-56 object-contain filter drop-shadow-2xl"
          onLoad={() => console.log('Left image loaded')}
          onError={(e) => console.error('Left image error:', e)}
          style={{ zIndex: 50 }}
        />
      </div>

      {/* Receiver person (right) */}
      <div className="absolute right-1/4 top-1/2 transform -translate-y-1/2 z-50">
        <img
          ref={rightPersonRef}
          src={rightPerson}
          alt="Receiver Person"
          className="w-56 h-56 object-contain filter drop-shadow-2xl"
          onLoad={() => console.log('Right image loaded')}
          onError={(e) => console.error('Right image error:', e)}
          style={{ zIndex: 50 }}
        />
      </div>
    </div>
  );
};

export default DeliveryAnimation; 