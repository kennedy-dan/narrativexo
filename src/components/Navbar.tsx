import { Send, Bot, User, Sparkles, Image, Video, X, Check, Download, Copy, Menu, Search, Bell } from 'lucide-react'

const Navbar = ({ onMenuClick }) => {
  return (
    <header className="bg-white border-b border-gray-200 px-4 lg:px-6 py-3 lg:py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Mobile menu button */}
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          
          {/* Search - hidden on mobile, shown on larger screens */}
          <div className="hidden sm:block relative">
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 w-64 lg:w-80 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 lg:space-x-4">
          {/* Search icon for mobile */}
          <button className="sm:hidden p-2 text-gray-400 hover:text-gray-600">
            <Search size={20} />
          </button>
          
          <button className="p-2 text-gray-400 hover:text-gray-600 relative">
            <Bell size={20} />
            <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
          </button>

          <div className="flex items-center space-x-2 lg:space-x-3">
            <div className="hidden sm:block text-right">
              <div className="text-sm font-medium text-gray-900">Silver Mettl</div>
              <div className="text-xs text-gray-500">Designer</div>
            </div>
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">S</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar