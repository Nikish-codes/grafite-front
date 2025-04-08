import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { getBookmarkedQuestions } from '../utils/localStorage';

const BookmarksPage = () => {
  const dispatch = useDispatch();
  const [bookmarks, setBookmarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState('newest');
  const user = useSelector(state => state.auth.user);
  
  // Load bookmarks from localStorage
  useEffect(() => {
    if (user?.supabaseUserId) {
      const bookmarkedQuestions = JSON.parse(localStorage.getItem('grafite_bookmarked_questions') || '{}');
      const userBookmarks = bookmarkedQuestions[user.supabaseUserId] || [];
      setBookmarks(userBookmarks);
    }
  }, [user]);
  
  // Filter and sort bookmarks based on search query and sort option
  const filteredBookmarks = bookmarks.filter(bookmark => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      bookmark.question_text.toLowerCase().includes(query) ||
      bookmark.moduleName.toLowerCase().includes(query) ||
      bookmark.chapterName.toLowerCase().includes(query)
    );
  }).sort((a, b) => {
    switch (sortOption) {
      case 'newest':
        return new Date(b.timestamp) - new Date(a.timestamp);
      case 'oldest':
        return new Date(a.timestamp) - new Date(b.timestamp);
      case 'moduleAZ':
        return a.moduleName.localeCompare(b.moduleName);
      case 'moduleZA':
        return b.moduleName.localeCompare(a.moduleName);
      default:
        return 0;
    }
  });
  
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };
  
  const handleRemoveBookmark = (bookmarkId) => {
    if (!user?.supabaseUserId) return;
    
    const bookmarkedQuestions = JSON.parse(localStorage.getItem('grafite_bookmarked_questions') || '{}');
    const userBookmarks = bookmarkedQuestions[user.supabaseUserId] || [];
    const updatedUserBookmarks = userBookmarks.filter(bookmark => bookmark.id !== bookmarkId);
    
    bookmarkedQuestions[user.supabaseUserId] = updatedUserBookmarks;
    localStorage.setItem('grafite_bookmarked_questions', JSON.stringify(bookmarkedQuestions));
    
    setBookmarks(updatedUserBookmarks);
  };
  
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bookmarked Questions</h1>
        <p className="text-muted-foreground">
          Review and practice questions you've saved for later
        </p>
      </div>
      
      {/* Search and Sort Controls */}
      <div className="flex flex-col md:flex-row justify-between mb-6 gap-4">
        <div className="relative w-full md:w-1/2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search bookmarks..."
            className="w-full rounded-md border border-input pl-8 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <label htmlFor="sort" className="text-sm whitespace-nowrap">Sort by:</label>
          <select
            id="sort"
            className="rounded-md border border-input py-1.5 pl-3 pr-8 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={sortOption}
            onChange={handleSortChange}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="moduleAZ">Subject (A-Z)</option>
            <option value="moduleZA">Subject (Z-A)</option>
          </select>
        </div>
      </div>
      
      {/* Bookmarks List */}
      {filteredBookmarks.length > 0 ? (
        <div className="space-y-4">
          {filteredBookmarks.map((bookmark) => (
            <Card key={bookmark.id} className="overflow-hidden hover:shadow-md transition-all border hover:border-primary">
              <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex space-x-2">
                    <Badge variant="outline" className="bg-primary/10 text-primary text-xs">
                      {bookmark.moduleName}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {bookmark.chapterName}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-muted-foreground"
                    onClick={() => handleRemoveBookmark(bookmark.id)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </Button>
                </div>
                
                <p className="text-sm mb-4">{bookmark.question_text}</p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Bookmarked {new Date(bookmark.timestamp).toLocaleDateString()}
                  </span>
                  <Link to={`/question/any/${bookmark.moduleName}/${bookmark.chapterName}/${bookmark.id}`}>
                    <Button size="sm">
                      Practice Now
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 border rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-muted-foreground mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
            />
          </svg>
          <h3 className="text-lg font-medium mb-2">No bookmarks found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No bookmarks match your search criteria.' : 'You haven\'t bookmarked any questions yet.'}
          </p>
          <Link to="/subjects">
            <Button>
              Browse Questions
            </Button>
          </Link>
        </div>
      )}
    </Layout>
  );
};

export default BookmarksPage;