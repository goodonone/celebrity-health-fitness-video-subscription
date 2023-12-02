class AddOn {
    addOn: string | undefined;
    desc: string | undefined;
    formName: string | undefined;
    timeFrame: {
        monthly: {
            price: string;
            addToTotal: number;
        };
        yearly: {
            price: string;
            addToTotal: number;
        };
    } | undefined
  }
  
  export const addOnOptions: AddOn[] = [
    {
      addOn: 'Online service',
      desc: 'Access to multiplayer games',
      formName: 'service',
      timeFrame: {
        monthly: {
          price: '+$1/mo',
          addToTotal: 1,
        },
        yearly: {
          price: '+$10/yr',
          addToTotal: 10,
        },
      },
    },
    {
      addOn: 'Larger storage',
      desc: 'Extra 1TB of cloud save',
      formName: 'storage',
      timeFrame: {
        monthly: {
          price: '+$2/mo',
          addToTotal: 2,
        },
        yearly: {
          price: '+$20/yr',
          addToTotal: 20,
        },
      },
    },
    {
      addOn: 'Customizable Profile',
      desc: 'Custom theme on your profile',
      formName: 'customization',
      timeFrame: {
        monthly: {
          price: '+$2/mo',
          addToTotal: 2,
        },
        yearly: {
          price: '+$20/yr',
          addToTotal: 20,
        },
      },
    },
  ];