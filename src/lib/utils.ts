export const getDHLShippingStatusInfo = (trackingStatus: string): ShippingStatusInfo => {
    const statusMap: Record<string, ShippingStatusInfo> = {
      'pre-transitd': {
        status: 'pre-transit',
        color: 'warning',
      },
      'delivered': {
        status: 'Delivered',
        color: 'primary',
      },
      'transit': {
        status: 'Transporting',
        color: 'secondary',
      },
      'unknown': {
        status: 'Unknown',
        color: 'default',
      },
    };
  
    return (
      statusMap[trackingStatus] || {
        status: 'Not shippable',
        color: 'default',
      }
    );
  };

  export const getPNShippingStatusInfo = (trackingStatus: string): ShippingStatusInfo => {
    const statusMap: Record<string, ShippingStatusInfo> = {
      'Electronic shipping instruction received': {
        status: 'Informed',
        color: 'warning',
      },
      'The shipment has been delivered to the recipient': {
        status: 'Delivered',
        color: 'primary',
      },
      'The shipment is under transportation': {
        status: 'Transporting',
        color: 'secondary',
      },
    };
  
    return (
      statusMap[trackingStatus] || {
        status: 'Not shippable',
        color: 'default',
      }
    );
  };