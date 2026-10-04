import React from 'react';
import StoresNearMe from '../../components/customer/StoresNearMe';

export default function StoresNearMePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <StoresNearMe
        title="Stores Near Me"
        subtitle="Discover verified poultry raisers, broiler farms, and egg suppliers in your area sorted by distance."
      />
    </div>
  );
}
