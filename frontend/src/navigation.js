import { fmtProcessName } from './utils';
import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './navigation.css';

function NavigationIndicator({processInfo}){
    return (<>
    <div className="navigation-indicator">
        Process {processInfo.current}/{processInfo.total}
        <span>
        {!processInfo.isFirst && '← '} 
        Use ← → arrows to navigate
        {!processInfo.isLast && ' →'}
        </span>
    </div>
  </>);
}

// Create context for global navigation
const NavigationContext = createContext();

const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
};

function NavigationProvider({ children }) {
  const [processList, setProcessList] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Function to get current process name from URL
  const getCurrentProcessName = () => {
    const pathParts = location.pathname.split('/');
    if (pathParts.length >= 3 && pathParts[2]) {
      return pathParts[2]; // Extract process name from URL
    }
    return null;
  };

  const getCurrentProcessInfo = (name) => {
    if (!processList.length) return { current: 0, total: 0 };
    
    const currentIndex = processList.findIndex(
      item => fmtProcessName(item.name) === fmtProcessName(name)
    );
    
        return {
        current: currentIndex + 1,
        total: processList.length,
        isFirst: currentIndex === 0,
        isLast: currentIndex === processList.length - 1
        };
    }


  // Function to navigate to previous/next process
  const navigateToProcess = (direction) => {
    const currentProcessName = getCurrentProcessName();
    if (!currentProcessName || processList.length === 0) {
      console.log('Navigation blocked: no current process or empty list', { currentProcessName, listLength: processList.length });
      return;
    }

    const currentIndex = processList.findIndex(
      item => fmtProcessName(item.name) === currentProcessName
    );

    if (currentIndex === -1) {
      console.log('Navigation blocked: current process not found in list', { currentProcessName, processList });
      return;
    }

    let newIndex;
    if (direction === 'prev') {
      newIndex = currentIndex > 0 ? currentIndex - 1 : processList.length - 1;
    } else {
      newIndex = currentIndex < processList.length - 1 ? currentIndex + 1 : 0;
    }

    const newProcess = processList[newIndex];
    const formattedName = fmtProcessName(newProcess.name);
    
    console.log('Navigating:', { 
      direction, 
      from: currentProcessName, 
      to: formattedName, 
      currentIndex, 
      newIndex 
    });
    
    // Determine which route to navigate to based on current path
    const currentRoute = location.pathname.split('/')[1];
    let newPath;
    switch (currentRoute) {
      case 'table':
        newPath = `/table/${formattedName}`;
        break;
      case 'scm_page':
        newPath = `/scm_page/${formattedName}`;
        break;
      case 'polygon_page':
        newPath = `/polygon_page/${formattedName}`;
        break;
      case 'graph':
        newPath = `/graph/${formattedName}`;
        break;
      case 'files':
        newPath = `/files/${formattedName}`;
        break;
      default:
        newPath = `/table/${formattedName}`;
    }
    
    console.log('Navigating to:', newPath);
    navigate(newPath);
  };

  // Global keyboard event handler
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Only handle arrow keys when not in input fields
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        console.log('Navigation blocked: typing in input field');
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          console.log('Left arrow pressed');
          event.preventDefault();
          navigateToProcess('prev');
          break;
        case 'ArrowRight':
          console.log('Right arrow pressed');
          event.preventDefault();
          navigateToProcess('next');
          break;
        case 'ArrowUp':
          console.log('Up arrow pressed');
          event.preventDefault();
          navigateToProcess('next');
          break;
        case 'ArrowDown':
          console.log('Down arrow pressed');
          event.preventDefault();
          navigateToProcess('prev');
          break;
        case 'h':
          console.log('Home pressed');
          event.preventDefault();
          navigate('/');
          break;
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    console.log('Setting up keyboard listener');
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [processList, location.pathname]);

  // Provide the context value exposed to the children
  const value = {    
    setProcessList,        
    getCurrentProcessInfo
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export { NavigationIndicator, NavigationProvider, useNavigation };