import React, { useEffect, useState } from 'react';
import Item from './Item';

const ItemList = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch('/api/items');
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  if (loading) {
    return (
      <section id="menu" className="container mx-auto px-4 py-10 dark:bg-gray-900">
        <p className="text-center text-lg text-gray-300 dark:text-gray-400">Loading menu...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section id="menu" className="container mx-auto px-4 py-10 dark:bg-gray-900">
        <p className="text-center text-lg text-red-500">{error}</p>
      </section>
    );
  }

  return (
    <section id="menu" className="container mx-auto px-4 py-8 dark:bg-gray-900">
      <h2 className="text-3xl font-bold text-center mb-6 text-white">Our Menu</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {items.map((item) => (
          <Item key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
};

export default ItemList;