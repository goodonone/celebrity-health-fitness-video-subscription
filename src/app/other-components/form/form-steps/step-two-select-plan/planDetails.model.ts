class Plan {
    plan: string = "";
    description: string = "";
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
      description: 'Workouts to get you started',
      billing: {
        monthly: {
          price: 'Free',
          addToTotal: 0,
          promo: '',
        },
        yearly: {
          price: 'Free',
          addToTotal: 0,
          promo: '',
        },
      } ,
    },
    {
      plan: 'Motivated',
      description: 'New Videos Every Week & Recipes to Keep You Going',
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
      plan: 'All In',
      description: 'Live One-On-Ones & Everything From The Motivated Plan',
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

