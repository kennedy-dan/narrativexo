"use client"
import React, { useState, useRef, useEffect } from 'react'
import { Settings, X, Check, Download, Copy, Menu, Search, Bell, NotebookPen, CalendarCheck2 } from 'lucide-react'

// Mobile responsive Sidebar
const Sidebar = ({ isOpen, onClose }) => {
  const menuItems = [
    { name: 'Narratives', icon: 'file-text', href: '/narratives' },
    { name: 'Search', icon: 'search', href: '/search' },
    { name: 'Subscriptions', icon: 'credit-card', href: '/subscriptions' },
    { name: 'Settings', icon: 'settings', href: '/settings' },
  ]

  const renderIcon = (iconName) => {
    const iconProps = { size: 20, strokeWidth: 2 }
    switch(iconName) {
      case 'file-text': 
                 return <NotebookPen {...iconProps} />

      case 'search': 
        return <Search {...iconProps} />
      case 'credit-card': 
        return <CalendarCheck2 {...iconProps} />
      case 'settings': 
        return <Settings {...iconProps} />
      default: 
        return null
    }
  }

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-64 bg-[#FAF9F6] border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <h1 className="font-semibold text-gray-900">Narrative Xo</h1>
            {/* Close button for mobile */}
            <button 
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-gray-500">Content Creator</p>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {/* Start New Narrative Button */}
          <button className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-[#A8D5A3] hover:bg-[#98C593] text-gray-800 rounded-lg transition-colors font-medium">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <path d="M12 8v8m-4-4h8"/>
            </svg>
            <span>Start New Narrative</span>
          </button>

          {/* Menu Items */}
          {menuItems.map((item) => (
            <button
              key={item.name}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-left text-gray-700 hover:bg-gray-50"
            >
              <div className="text-gray-600">
                {renderIcon(item.icon)}
              </div>
              <span className="font-normal">{item.name}</span>
            </button>
          ))}
        </nav>
      </div>
    </>
  )
}

export default Sidebar