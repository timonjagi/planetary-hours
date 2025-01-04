import React, {useEffect, useState} from 'react';
import {Card, CardHeader, CardContent} from '../components/ui/card';
import {Button} from '../components/ui/button';
import {Input} from '../components/ui/input';
import {Tabs, TabsList, TabsTrigger, TabsContent} from '../components/ui/tabs';
import {
  Container,
  Stack,
  Box,
  Text,
  List,
  ListItem,
} from '../components/ui/layout';

import {Geolocation} from '@capacitor/geolocation';
import {fetchPlanetaryHours} from '../services/planetaryHoursService';
import {
  requestPermissions,
  scheduleNotification,
} from '../services/notificationService';
import {LocalNotifications} from '@capacitor/local-notifications';
import {useToast} from '../hooks/use-toast';

interface PlanetaryHour {
  Start: string;
  End: string;
  Ruler: string;
}

interface Location {
  latitude: number;
  longitude: number;
}

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [planetaryData, setPlanetaryData] = useState<any>(null);
  const [location, setLocation] = useState<Location | null>(null);

  const {toast} = useToast();

  const getCurrentLocation = async () => {
    try {
      // For web browsers, we need to check if geolocation is available
      if (!('geolocation' in navigator)) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const permissions = await Geolocation.checkPermissions();
      if (
        permissions.location === 'prompt' ||
        permissions.location === 'denied'
      ) {
        toast({
          description:
            'Please allow location access to get accurate planetary hours.',
          variant: 'default',
        });
        await Geolocation.requestPermissions();
      }

      const position = await Geolocation.getCurrentPosition();
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch (error) {
      toast({
        description: 'Error getting location. Using default coordinates.',
        variant: 'destructive',
        duration: 3000,
      });
      setLocation({
        latitude: 30.8774,
        longitude: -84.2013,
      });
    }
  };

  const fetchData = async (date: string) => {
    if (!location) return;

    try {
      setLoading(true);
      const data = await fetchPlanetaryHours(
        date,
        location.latitude,
        location.longitude
      );
      setPlanetaryData(data.Response);
      await handleScheduleNotifications();

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
      toast({
        description: 'Error fetching planetary hours data.',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const scheduleHourNotifications = async (hours: {
    [key: string]: PlanetaryHour;
  }) => {
    try {
      // Cancel any existing notifications first
      await LocalNotifications.cancel({notifications: []});

      Object.entries(hours).forEach(async ([hourName, details]) => {
        const [hours, minutes] = details.Start.split(':');
        const scheduleTime = new Date(selectedDate);
        scheduleTime.setHours(parseInt(hours));
        scheduleTime.setMinutes(parseInt(minutes));
        scheduleTime.setSeconds(0);

        // Only schedule if the time is in the future
        if (scheduleTime > new Date()) {
          await scheduleNotification(
            `${hourName} - ${details.Ruler} Hour`,
            `The ${details.Ruler} hour begins now and ends at ${details.End}`,
            scheduleTime
          );
        }
      });

      toast({
        description: 'Notifications scheduled successfully',
        duration: 2000,
      });
    } catch (error) {
      toast({
        description: 'Error scheduling notifications',
        duration: 2000,
      });
    }
  };

  const handleScheduleNotifications = async () => {
    if (!planetaryData) return;

    try {
      // Schedule both solar and lunar hours
      await scheduleHourNotifications(planetaryData.SolarHours);
      await scheduleHourNotifications(planetaryData.LunarHours);

      toast({
        description: 'Notifications scheduled for planetary hours',
        variant: 'destructive',
        duration: 3000,
      });
    } catch (error) {
      toast({
        description: 'Error scheduling notifications',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  const handleLocationRequest = async () => {
    try {
      // Show loading state
      toast({
        description: 'Getting your location...',
        variant: 'default',
        duration: undefined,
      });

      await getCurrentLocation();

      toast({
        description: 'Location updated successfully',
        variant: 'destructive',
        duration: 2000,
      });
    } catch (error) {
      toast({
        description: 'Error updating location',
        variant: 'destructive',
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      await requestPermissions();
      await getCurrentLocation();
    };

    initializeApp();
  }, []);

  useEffect(() => {
    if (location) {
      fetchData(selectedDate);
    }
  }, [selectedDate, location]);

  const renderHoursList = (hours: {[key: string]: PlanetaryHour}) => {
    return Object.entries(hours).map(([hourName, details]) => (
      <ListItem key={hourName} className='p-4 border-b border-border'>
        <Stack className='items-start space-y-1'>
          <Text className='text-primary font-bold'>{hourName}</Text>
          <Text>
            {details.Start} - {details.End}
          </Text>
          <Text>Ruler: {details.Ruler}</Text>
        </Stack>
      </ListItem>
    ));
  };

  return (
    <Container className='max-w-6xl'>
      <Stack className='space-y-6 py-8'>
        {/* Welcome/Intro Section */}
        <Box className='text-center'>
          <h1 className='text-4xl font-bold mb-2'>Planetary Hours</h1>
          <Text className='text-muted-foreground'>
            Calculate planetary hours based on your location and date
          </Text>
        </Box>

        {/* Location Setup Card */}
        <Card>
          <CardContent>
            <Stack className='space-y-4'>
              {location ? (
                <Stack className='flex-row justify-between items-center'>
                  <Text>
                    📍 Location: {location.latitude.toFixed(4)},{' '}
                    {location.longitude.toFixed(4)}
                  </Text>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleLocationRequest}
                  >
                    Update Location
                  </Button>
                </Stack>
              ) : (
                <Stack className='items-center space-y-3 py-4'>
                  <Text>To get started, we need your location</Text>
                  <Button onClick={handleLocationRequest}>
                    Share My Location
                  </Button>
                </Stack>
              )}
            </Stack>
          </CardContent>
        </Card>

        {/* Date Selection and Results */}
        {location && (
          <Stack className='space-y-4'>
            <Card>
              <CardContent>
                <Stack className='space-y-4'>
                  <Stack className='flex-row justify-between items-center'>
                    <Text className='font-medium'>Select a date:</Text>
                    <Button
                      size='sm'
                      variant='outline'
                      onClick={handleScheduleNotifications}
                      disabled={!planetaryData}
                    >
                      Set Notifications
                    </Button>
                  </Stack>
                  <Input
                    type='date'
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                </Stack>
              </CardContent>
            </Card>

            {loading ? (
              <Stack className='text-center p-4'>
                <Text>Calculating planetary hours...</Text>
              </Stack>
            ) : (
              planetaryData && (
                <Stack className='space-y-4'>
                  <Card>
                    <CardHeader>
                      <Stack className='flex-row justify-between items-center'>
                        <h2 className='text-xl font-bold'>Day Information</h2>
                        <Text className='text-muted-foreground text-sm'>
                          {planetaryData.General.Date}
                        </Text>
                      </Stack>
                    </CardHeader>
                    <CardContent>
                      <List className='space-y-3'>
                        <ListItem>
                          <Text className='font-medium'>Day of Week:</Text>{' '}
                          {planetaryData.General.DayoftheWeek}
                        </ListItem>
                        <ListItem>
                          <Text className='font-medium'>Planetary Ruler:</Text>{' '}
                          {planetaryData.General.PlanetaryRuler}
                        </ListItem>
                      </List>
                    </CardContent>
                  </Card>

                  <Tabs defaultValue='solar' className='w-full'>
                    <TabsList>
                      <TabsTrigger value='solar'>Solar Hours</TabsTrigger>
                      <TabsTrigger value='lunar'>Lunar Hours</TabsTrigger>
                    </TabsList>
                    <Card className='mt-4'>
                      <CardContent>
                        <TabsContent value='solar'>
                          <List className='space-y-3'>
                            {renderHoursList(planetaryData.SolarHours)}
                          </List>
                        </TabsContent>
                        <TabsContent value='lunar'>
                          <List className='space-y-3'>
                            {renderHoursList(planetaryData.LunarHours)}
                          </List>
                        </TabsContent>
                      </CardContent>
                    </Card>
                  </Tabs>
                </Stack>
              )
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};

export default App;
