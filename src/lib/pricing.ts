import { Course } from './types';

export interface PriceBreakdown {
  originalPrice: number;
  basePrice: number;
  discountAmount: number;
  couponDiscount: number;
  finalPrice: number;
  amountInPaise: number;
  couponCode?: string;
  couponLabel?: string;
  isValidCoupon: boolean;
}

/**
 * Valid Promo & Scholarship Coupon Rules for Aspire Academy
 */
export const VALID_COUPONS: Record<
  string,
  {
    discountType: 'fixed' | 'percentage';
    discountValue: number;
    label: string;
    description: string;
  }
> = {
  TOPPER100: {
    discountType: 'fixed',
    discountValue: 100,
    label: 'TOPPER100',
    description: 'Flat ₹100 Topper Scholarship Discount',
  },
  SHEKHAR50: {
    discountType: 'fixed',
    discountValue: 50,
    label: 'SHEKHAR50',
    description: 'Flat ₹50 Shekhar Sir Mentorship Discount',
  },
  BIHAR20: {
    discountType: 'percentage',
    discountValue: 20,
    label: 'BIHAR20',
    description: '20% Bihar Board Target Batch Discount',
  },
};

/**
 * Centrally calculates course pricing, discounts, and coupon deductions.
 * Guarantees 100% mathematical consistency between UI display and backend order creation.
 */
export function calculateCoursePrice(
  course: Course,
  rawCouponCode?: string
): PriceBreakdown {
  const basePrice = Math.max(0, course.price);
  const originalPrice = Math.max(basePrice, course.original_price || basePrice);
  const discountAmount = Math.max(0, originalPrice - basePrice);

  const cleanCoupon = (rawCouponCode || '').trim().toUpperCase();
  let couponDiscount = 0;
  let isValidCoupon = false;
  let couponLabel: string | undefined;

  if (cleanCoupon && VALID_COUPONS[cleanCoupon]) {
    const coupon = VALID_COUPONS[cleanCoupon];
    isValidCoupon = true;
    couponLabel = `${coupon.label} (${coupon.description})`;

    if (coupon.discountType === 'fixed') {
      // Must leave at least ₹1 payable
      couponDiscount = Math.min(coupon.discountValue, Math.max(0, basePrice - 1));
    } else if (coupon.discountType === 'percentage') {
      const computed = Math.round((basePrice * coupon.discountValue) / 100);
      couponDiscount = Math.min(computed, Math.max(0, basePrice - 1));
    }
  }

  const finalPrice = Math.max(1, basePrice - couponDiscount);
  const amountInPaise = Math.round(finalPrice * 100);

  return {
    originalPrice,
    basePrice,
    discountAmount,
    couponDiscount,
    finalPrice,
    amountInPaise,
    couponCode: isValidCoupon ? cleanCoupon : undefined,
    couponLabel,
    isValidCoupon,
  };
}
