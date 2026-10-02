import React, { useState, useContext } from 'react';
import { CartContext } from '../context/CartContext';

const Item = ({ item }) => {
  const { addItem } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      setQuantity(val);
    }
  };

  const handleAddToCart = () => {
    addItem(item, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="bg-gray-800 rounded-lg shadow-md p-4 flex flex-col items-center">
      <img
        src={item.image}
        alt={item.name}
        className="w-32 h-32 object-cover rounded-full mb-4"
      />
      <h3 className="text-xl font-semibold text-white">{item.name}</h3>
      <p className="text-sm text-gray-400 mt-1 text-center">{item.description}</p>
      <p className="text-lg font-bold text-yellow-400 mt-2">
        ${item.price.toFixed(2)}
      </p>

      <div className="flex items-center mt-4">
        <label htmlFor={`qty-${item.id}`} className="sr-only">
          Quantity
        </label>
        <input
          id={`qty-${item.id}`}
          type="number"
          min="1"
          value={quantity}
          onChange={handleQuantityChange}
          className="w-16 text-center text-gray-800 rounded-md border border-gray-600 focus:outline-none focus:ring-2 focus:ring-yellow-400"
        />
        <button
          onClick={handleAddToCart}
          disabled={quantity < 1}
          className={`ml-4 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            quantity < 1
              ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
              : 'bg-yellow-400 text-gray-800 hover:bg-yellow-500'
          }`}
        >
          {added ? 'Added!' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default Item;