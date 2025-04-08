import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import { Card } from '../components/ui/card';

const TopicsPage = () => {
  const { examType, chapterId } = useParams();
  const navigate = useNavigate();
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        // TODO: Replace with actual API call
        // Mock data for now
        const mockTopics = [
          { id: 1, title: 'Topic 1: Kinematics' },
          { id: 2, title: 'Topic 2: Newton\'s Laws' },
          { id: 3, title: 'Topic 3: Work and Energy' },
        ];
        setTopics(mockTopics);
        setLoading(false);
      } catch (err) {
        setError('Failed to load topics');
        setLoading(false);
      }
    };

    fetchTopics();
  }, [examType, chapterId]);

  const handleTopicClick = (topicId) => {
    navigate(`/questions/${examType}/${chapterId}/${topicId}`);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">Loading topics...</div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-red-500">{error}</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4 text-white">Select a Topic</h1>
          <p className="text-lg text-gray-400">Choose a topic to start practicing</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <Card
              key={topic.id}
              className="p-6 rounded-lg bg-neutral-900 shadow hover:shadow-lg transition hover:-translate-y-1 cursor-pointer border border-neutral-800 hover:border-primary"
              onClick={() => handleTopicClick(topic.id)}
            >
              <h2 className="text-xl font-semibold text-primary mb-2 hover:text-purple-300 transition-colors">
                {topic.title}
              </h2>
              <div className="mt-4 flex justify-end">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-6 w-6 text-primary/60"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default TopicsPage;