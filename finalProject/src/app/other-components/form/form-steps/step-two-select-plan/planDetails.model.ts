// interface Plan2{
//   plan: string;
//   icon: string;
//   duration: string;
//   price: string;
//   addToTotal: number;
//   promo: string;
// }

// export const planOptions2: Plan2[] = [
//   {
//     plan: 'monthly',
//     icon: '/assets/images/icon-arcade.svg',
//     duration: 'monthly',
//     price: '$9/mo',
//     addToTotal: 9,
//     promo: '',
//   },
//   {
//     plan: 'yearly',
//     icon: '/assets/images/icon-arcade.svg',
//     duration: 'yearly',
//     price: '$90/yr',
//     addToTotal: 90,
//     promo: '2 months free',
//   },
// ];

class Plan {
    plan: string = "";
    color: string = "";
    billing: {
      monthly: {
        price: string;
        addToTotal: number;
        promo: string;
      };
      yearly: {
        price: string;
        addToTotal: number;
        promo: string;
      };
    } | undefined
  }
  
  export const planOptions: Plan[] = [
    {
      plan: 'Just Looking',
      color: '/assets/images/icon-arcade.svg',
      billing: {
        monthly: {
          price: 'Free',
          addToTotal: 0,
          promo: '',
        },
        yearly: {
          price: '0',
          addToTotal: 0,
          promo: '',
        },
      } ,
    },
    {
      plan: 'Motivated',
      color: '/assets/images/icon-advanced.svg',
      billing: {
        monthly: {
          price: '$12/mo',
          addToTotal: 12,
          promo: '',
        },
        yearly: {
          price: '$120/yr',
          addToTotal: 120,
          promo: '2 months free',
        },
      },
    },
    {
      plan: 'All In!',
      color: '/assets/images/icon-pro.svg',
      billing: {
        monthly: {
          price: '$20/mo',
          addToTotal: 20,
          promo: '',
        },
        yearly: {
          price: '$200/yr',
          addToTotal: 200,
          promo: '2 months free',
        },
      },
    },
  ];

