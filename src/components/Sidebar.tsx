"use client"
import React, { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Sparkles, Image, Video, X, Check, Download, Copy, Menu, Search, Bell } from 'lucide-react'

// Mobile responsive Sidebar
const Sidebar = ({ isOpen, onClose }) => {
  const [activeNarrative, setActiveNarrative] = useState(true)
  
   const menuItems = [
    { name: 'Narratives', icon: '/images/narr.png', href: '/narratives', active: true },

    { name: 'Subscriptions', icon: '/images/subs.png', href: '/subscriptions' },
    { name: 'Settings', icon: '/images/set.png', href: '/settings' },
  ]

  const narrativeSubmenu = [
    { name: 'Create Narrative', href: '/narratives/create' },
    { name: 'Active Narratives', href: '/narratives/active' },
  ]

  const campaignSubmenu = [
    { name: 'Campaign Account', href: '/campaigns/account' },
    { name: 'User management', href: '/campaigns/users' },
  ]

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
        w-64 bg-white border-r border-gray-200 flex flex-col
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                N
              </div>
              <div>
                <div className="font-bold text-gray-900 text-sm sm:text-base">NARRATIVES</div>
                <div className="text-xs text-gray-500">CONTENT CREATOR</div>
              </div>
            </div>
            {/* Close button for mobile */}
            <button 
              onClick={onClose}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <div key={item.name}>
              <button
                className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  item.active
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <img src={item.icon} />
                <span className="font-medium text-sm">{item.name}</span>
              </button>
              
   

              {/* Submenu for Campaigns */}
              {item.name === 'Campaigns' && (
                <div className="ml-6 mt-1 space-y-1">
                  {campaignSubmenu.map((subItem) => (
                    <button
                      key={subItem.name}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 rounded-lg transition-colors text-left"
                    >
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <span>{subItem.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>
    </>
  )
}

export default Sidebar