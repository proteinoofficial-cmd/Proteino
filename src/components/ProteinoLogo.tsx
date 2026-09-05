import React from 'react';
import proteinoOfficialLogoSvg from '../assets/images/proteino_official_logo.svg';

interface ProteinoLogoProps {
  size?: number | string;
  className?: string;
  variant?: 'image' | 'vector';
  showBackground?: boolean;
}

/**
 * Official Proteino Brand Logo Component
 * Replicates the exact authentic Proteino brand artwork uploaded by the user:
 * - Solid Dark Navy Canvas (#18233C)
 * - Stylized Fitness Salad Bowl with Chicken Drumstick, Carrot, Broccoli, Tomato & Fork in Vibrant Lime Green (#82C940)
 * - Accent Elements (Circle dot on rim, floating leaf, lower leaf sprig) in Light Steel Blue (#5C8AB5)
 * - Athletic Italic Uppercase Typography "PROTEINO" in Lime Green (#82C940)
 */
export default function ProteinoLogo({
  size = 140,
  className = '',
  variant = 'image',
  showBackground = true
}: ProteinoLogoProps) {
  if (variant === 'image') {
    return (
      <div 
        className={`relative overflow-hidden rounded-3xl flex items-center justify-center ${showBackground ? 'bg-[#18233C]' : ''} ${className}`}
        style={{ width: size, height: size }}
      >
        <img 
          src={proteinoOfficialLogoSvg} 
          alt="Proteino Official Logo"
          className="w-full h-full object-contain"
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Vector SVG representation for ultra-crisp resolution at any zoom scale
  return (
    <div 
      className={`relative overflow-hidden rounded-3xl flex items-center justify-center ${showBackground ? 'bg-[#18233C]' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 1000 1000"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        {showBackground && (
          <rect width="1000" height="1000" fill="#18233C" rx="0" />
        )}

        {/* ================= INGREDIENTS & ARTWORK ================= */}
        <g id="proteino-artwork">
          
          {/* 1. CHICKEN DRUMSTICK (Left) */}
          <circle cx="323" cy="314" r="15" fill="#18233C" stroke="#82C940" strokeWidth="12" />
          <circle cx="340" cy="336" r="15" fill="#18233C" stroke="#82C940" strokeWidth="12" />
          <path d="M 334 316 L 362 344" stroke="#82C940" strokeWidth="12" strokeLinecap="round" />
          <path 
            d="M 358 340 C 348 370, 372 418, 412 408 C 445 398, 460 365, 436 338 C 416 316, 376 318, 358 340 Z" 
            fill="#18233C" 
            stroke="#82C940" 
            strokeWidth="12" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* 2. LIGHT STEEL BLUE ACCENTS (Dot & Floating Leaf) */}
          <path 
            d="M 460 334 C 466 316, 484 318, 492 328 C 480 344, 466 342, 460 334 Z" 
            fill="#5C8AB5" 
          />
          <path d="M 466 330 Q 476 324 487 326" stroke="#18233C" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* 3. CARROT (Center-Left) */}
          <path d="M 552 306 C 540 286, 552 270, 562 292" stroke="#82C940" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M 562 292 C 568 268, 584 274, 576 298" stroke="#82C940" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path d="M 576 298 C 594 286, 602 304, 584 316" stroke="#82C940" strokeWidth="10" strokeLinecap="round" fill="none" />
          <path 
            d="M 550 318 C 556 310, 578 318, 582 328 L 500 395 C 492 396, 488 390, 492 384 Z" 
            fill="#18233C" 
            stroke="#82C940" 
            strokeWidth="12" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path d="M 540 338 L 560 348" stroke="#82C940" strokeWidth="8" strokeLinecap="round" />
          <path d="M 522 358 L 542 368" stroke="#82C940" strokeWidth="8" strokeLinecap="round" />
          <path d="M 506 378 L 522 386" stroke="#82C940" strokeWidth="8" strokeLinecap="round" />

          {/* 4. BROCCOLI (Upper Right) */}
          <path d="M 620 395 L 626 414" stroke="#82C940" strokeWidth="11" strokeLinecap="round" />
          <path 
            d="M 602 388 C 592 370, 602 350, 618 356 C 625 340, 648 344, 655 358 C 674 356, 682 376, 672 392 C 678 406, 665 422, 648 416 C 638 424, 616 418, 608 400 C 600 400, 595 394, 602 388 Z" 
            fill="#18233C" 
            stroke="#82C940" 
            strokeWidth="12" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path d="M 628 382 Q 636 372 646 374" stroke="#82C940" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M 640 388 Q 652 382 660 388" stroke="#82C940" strokeWidth="7" strokeLinecap="round" fill="none" />

          {/* 5. SALAD BOWL */}
          <path 
            d="M 324 394 C 342 368, 674 372, 688 408" 
            fill="none" 
            stroke="#82C940" 
            strokeWidth="11" 
            strokeLinecap="round" 
          />
          <path 
            d="M 318 395 L 342 526 C 420 564, 580 564, 658 536 L 692 410" 
            fill="#18233C" 
            stroke="#82C940" 
            strokeWidth="13" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M 318 395 C 330 435, 670 435, 692 410" 
            fill="none" 
            stroke="#82C940" 
            strokeWidth="13" 
            strokeLinecap="round" 
          />
          <circle cx="357" cy="397" r="9.5" fill="#5C8AB5" />

          {/* 6. TOMATO (Front Center) */}
          <circle cx="476" cy="436" r="35" fill="#18233C" stroke="#82C940" strokeWidth="12" />
          <path d="M 476 404 L 460 405" stroke="#82C940" strokeWidth="8" strokeLinecap="round" />
          <path d="M 476 404 L 467 392" stroke="#82C940" strokeWidth="8" strokeLinecap="round" />
          <path d="M 476 404 L 485 392" stroke="#82C940" strokeWidth="8" strokeLinecap="round" />
          <path d="M 476 404 L 492 405" stroke="#82C940" strokeWidth="8" strokeLinecap="round" />
          <path d="M 476 404 L 476 414" stroke="#82C940" strokeWidth="8" strokeLinecap="round" />
          <path d="M 476 402 Q 473 390 467 392" stroke="#82C940" strokeWidth="7" strokeLinecap="round" fill="none" />
          <path d="M 458 424 A 20 20 0 0 1 474 414" stroke="#82C940" strokeWidth="7" strokeLinecap="round" fill="none" />

          {/* 7. LIGHT STEEL BLUE LEAF SPRIG BELOW TOMATO */}
          <path 
            d="M 526 468 C 520 472, 522 480, 528 480 C 526 486, 532 492, 536 486 C 542 490, 546 482, 538 476 C 542 470, 534 466, 526 468 Z" 
            fill="#5C8AB5" 
          />

          {/* 8. FORK */}
          <path d="M 546 414 L 533 397" stroke="#82C940" strokeWidth="11" strokeLinecap="round" />
          <path d="M 556 405 L 543 388" stroke="#82C940" strokeWidth="11" strokeLinecap="round" />
          <path d="M 566 396 L 553 379" stroke="#82C940" strokeWidth="11" strokeLinecap="round" />
          <path d="M 576 387 L 563 370" stroke="#82C940" strokeWidth="11" strokeLinecap="round" />
          <path 
            d="M 533 397 C 530 405, 540 422, 546 422 L 576 395 C 578 388, 570 372, 563 370" 
            stroke="#82C940" 
            strokeWidth="11" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="none" 
          />
          <path 
            d="M 586 442 L 685 550 C 692 558, 698 554, 695 545 L 598 435 Z" 
            stroke="#82C940" 
            strokeWidth="12" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            fill="#18233C" 
          />
        </g>

        {/* ================= 9. "PROTEINO" TYPOGRAPHY ================= */}
        <g fill="#82C940" transform="skewX(-8)">
          {/* P */}
          <path d="M 175 620 L 222 620 C 242 620, 256 630, 256 648 C 256 666, 242 676, 222 676 L 199 676 L 199 705 L 175 705 Z M 199 638 L 199 658 L 220 658 C 228 658, 232 654, 232 648 C 232 642, 228 638, 220 638 Z" />
          {/* R */}
          <path d="M 270 620 L 316 620 C 336 620, 350 630, 350 648 C 350 662, 340 672, 326 675 L 354 705 L 326 705 L 302 676 L 294 676 L 294 705 L 270 705 Z M 294 638 L 294 658 L 314 658 C 322 658, 326 654, 326 648 C 326 642, 322 638, 314 638 Z" />
          {/* O */}
          <path d="M 370 620 L 418 620 C 438 620, 448 632, 448 650 L 448 675 C 448 693, 438 705, 418 705 L 370 705 C 350 705, 340 693, 340 675 L 340 650 C 340 632, 350 620, 370 620 Z M 364 648 L 364 677 C 364 684, 368 688, 376 688 L 412 688 C 420 688, 424 684, 424 677 L 424 648 C 424 641, 420 637, 412 637 L 376 637 C 368 637, 364 641, 364 648 Z" />
          {/* T */}
          <path d="M 458 620 L 526 620 L 526 638 L 504 638 L 504 705 L 480 705 L 480 638 L 458 638 Z" />
          {/* E */}
          <path d="M 538 620 L 596 620 L 596 638 L 562 638 L 562 653 L 592 653 L 592 671 L 562 671 L 562 687 L 596 687 L 596 705 L 538 705 Z" />
          {/* I */}
          <path d="M 608 620 L 632 620 L 632 705 L 608 705 Z" />
          {/* N */}
          <path d="M 646 620 L 670 620 L 702 668 L 702 620 L 724 620 L 724 705 L 700 705 L 668 656 L 668 705 L 646 705 Z" />
          {/* O */}
          <path d="M 744 620 L 792 620 C 812 620, 822 632, 822 650 L 822 675 C 822 693, 812 705, 792 705 L 744 705 C 724 705, 714 693, 714 675 L 714 650 C 714 632, 724 620, 744 620 Z M 738 648 L 738 677 C 738 684, 742 688, 750 688 L 786 688 C 794 688, 798 684, 798 677 L 798 648 C 798 641, 794 637, 786 637 L 750 637 C 742 637, 738 641, 738 648 Z" />
        </g>
      </svg>
    </div>
  );
}

