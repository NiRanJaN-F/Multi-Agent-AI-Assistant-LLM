import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchProducts, addToCart, removeFromCart } from '../store/actions';
import { lucide } from 'lucide';

const ProductCard = () => {
  const { productId } = useParams();
  const dispatch = useDispatch();

  const [product, setProduct] = useState({});
  const products = useSelector(state => state.products);

  useEffect(() => {
    if (productId) {
      dispatch(fetchProducts(productId));
    }
  }, [productId, dispatch]);

  const handleAddToCart = (productId) => {
    dispatch(addToCart(productId));
  };

  const handleRemoveFromCart = (productId) => {
    dispatch(removeFromCart(productId));
  };

  return (
    <div className="flex flex-col items-center p-10 bg-white rounded-lg shadow-md w-full h-full">
      <div className="flex flex-col items-center p-5 bg-gray-100 rounded-lg shadow-md w-full h-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">{product.name}</h2>
        <div className="flex flex-col items-center p-4 bg-gray-200 rounded-lg shadow-md w-full h-full">
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          <div className="flex flex-col items-center p-4 bg-gray-200 rounded-lg shadow-md w-full h-full">
            <h3 className="text-lg font-bold text-gray-800 mb-4">{product.name}</h3>
            <p className="text-sm font-normal text-gray-700 mb-4">{product.description}</p>
            <div className="flex flex-col items-center p-4 bg-gray-200 rounded-lg shadow-md w-full h-full">
              <h2 className="text-lg font-bold text-gray-800 mb-4">{product.name}</h2>
              <p className="text-sm font-normal text-gray-700 mb-4">{product.description}</p>
              <div className="flex flex-col items-center p-4 bg-gray-200 rounded-lg shadow-md w-full h-full">
                <h2 className="text-lg font-bold text-gray-800 mb-4">{product.name}</h2>
                <p className="text-sm font-normal text-gray-700 mb-4">{product.description}</p>
                <div className="flex flex-col items-center p-4 bg-gray-200 rounded-lg shadow-md w-full h-full">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">{product.name}</h2>
                  <p className="text-sm font-normal text-gray-700 mb-4">{product.description}</p>
                  <div className="flex flex-col items-center p-4 bg-gray-200 rounded-lg shadow-md w-full h-full">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">{product.name}</h2>
                    <p className="text-sm font-normal text-gray-700 mb-4">{product.description}</p>
                    <div className="flex flex-col items-center p-4 bg-gray-200 rounded-lg shadow-md w-full h-full">
                        <h2 className="text-lg font-bold text-gray-800 mb-4">{product.name}</h2>