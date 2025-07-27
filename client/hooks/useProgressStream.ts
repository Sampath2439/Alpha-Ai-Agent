import { useEffect, useRef, useState } from 'react';
import { ResearchProgress } from '@shared/api';

interface ProgressStreamEvent {
  type: 'connected' | 'progress' | 'completed' | 'failed' | 'queued' | 'heartbeat';
  data?: ResearchProgress;
  timestamp?: string;
}

export function useProgressStream() {
  const [isConnected, setIsConnected] = useState(false);
  const [jobs, setJobs] = useState<Map<string, ResearchProgress>>(new Map());
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connectToSSE = () => {
    try {
      // Clean up any existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      // Create EventSource connection
      const eventSource = new EventSource('/api/progress-stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log('SSE connection opened');
        setIsConnected(true);
      };

      eventSource.onerror = (error) => {
        console.warn('SSE connection error, will retry in 5 seconds:', error);
        setIsConnected(false);
        
        // Close the current connection
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
          eventSourceRef.current = null;
        }

        // Retry connection after 5 seconds
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('Retrying SSE connection...');
          connectToSSE();
        }, 5000);
      };

      eventSource.onmessage = (event) => {
        try {
          const eventData: ProgressStreamEvent = JSON.parse(event.data);
          
          switch (eventData.type) {
            case 'connected':
              console.log('Connected to progress stream');
              break;
              
            case 'queued':
            case 'progress':
            case 'completed':
            case 'failed':
              if (eventData.data) {
                setJobs(prev => new Map(prev.set(eventData.data!.person_id, eventData.data!)));
              }
              break;
              
            case 'heartbeat':
              // Just keep the connection alive
              break;
              
            default:
              console.log('Unknown SSE event type:', eventData.type);
          }
        } catch (error) {
          console.error('Error parsing SSE data:', error);
        }
      };

    } catch (error) {
      console.error('Failed to create SSE connection:', error);
      setIsConnected(false);
      
      // Retry after 10 seconds if initial connection fails
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      reconnectTimeoutRef.current = setTimeout(() => {
        console.log('Retrying SSE connection after connection failure...');
        connectToSSE();
      }, 10000);
    }
  };

  useEffect(() => {
    connectToSSE();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsConnected(false);
    };
  }, []);

  const getJobProgress = (personId: string): ResearchProgress | undefined => {
    return jobs.get(personId);
  };

  const getAllJobs = (): ResearchProgress[] => {
    return Array.from(jobs.values());
  };

  return {
    isConnected,
    jobs,
    getJobProgress,
    getAllJobs
  };
}
