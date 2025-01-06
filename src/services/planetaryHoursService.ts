interface PlanetaryHoursResponse {
  Response: {
    General: {
      Date: string;
      DayoftheWeek: string;
      PlanetaryRuler: string;
      Latitude: string;
      Longitude: string;
    };
    SolarHours: {
      [key: string]: PlanetaryHour;
    };
    LunarHours: {
      [key: string]: PlanetaryHour;
    };
  };
}
interface PlanetaryHour {
  start: string;
  end: string;
  ruler: any;
}

const CHALDEAN_ORDER = [
  'Saturn',
  'Jupiter',
  'Mars',
  'Sun',
  'Venus',
  'Mercury',
  'Moon',
];

const DAY_TO_PLANET_MAP: any = {
  Sunday: 'Sun',
  Monday: 'Moon',
  Tuesday: 'Mars',
  Wednesday: 'Mercury',
  Thursday: 'Jupiter',
  Friday: 'Venus',
  Saturday: 'Saturn',
};

function getPlanetaryRuler(hourIndex: number, startIndex: number): string {
  // Calculate the index in the Chaldean order, starting from the provided startIndex
  const index = (startIndex + hourIndex) % CHALDEAN_ORDER.length;
  return CHALDEAN_ORDER[index];
}

function getDayRulerIndex(dayOfWeek: string): number {
  const planet = DAY_TO_PLANET_MAP[dayOfWeek];
  return CHALDEAN_ORDER.findIndex((ruler) => ruler === planet);
}

async function fetchSunriseSunsetTimes(
  date: Date,
  latitude: number,
  longitude: number
): Promise<{sunrise: Date; sunset: Date}> {
  const formattedDate = date.toISOString().split('T')[0];
  const url = `https://api.sunrise-sunset.org/json?lat=${latitude}&lng=${longitude}&date=${formattedDate}&formatted=0`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error('Failed to fetch sunrise/sunset times');
    }

    return {
      sunrise: new Date(data.results.sunrise),
      sunset: new Date(data.results.sunset),
    };
  } catch (error) {
    console.error('Error fetching sunrise/sunset times:', error);
    throw error;
  }
}

function calculateSunrise(
  date: Date,
  latitude: number,
  longitude: number
): Promise<Date> {
  return fetchSunriseSunsetTimes(date, latitude, longitude).then(
    (times) => times.sunrise
  );
}

// function calculateSunset(
//   date: Date,
//   latitude: number,
//   longitude: number
// ): Promise<Date> {
//   return fetchSunriseSunsetTimes(date, latitude, longitude).then(
//     (times) => times.sunset
//   );
// }

// Update calculatePlanetaryHours to use async/await for sunrise and sunset
export const calculatePlanetaryHours = async (
  date: Date,
  latitude: number,
  longitude: number
): Promise<PlanetaryHoursResponse> => {
  // Ensure we're working with the start of the day in local time
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);

  console.log(latitude, longitude);

  try {
    // Calculate sunrise and sunset times for the current day
    const {sunrise: sunriseTime, sunset: sunsetTime} =
      await fetchSunriseSunsetTimes(localDate, latitude, longitude);

    // Calculate next day's sunrise
    const nextDay = new Date(localDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextSunrise = await calculateSunrise(nextDay, latitude, longitude);

    const dayOfWeek = localDate.toLocaleDateString('en-US', {weekday: 'long'});

    // Calculate precise lengths
    const dayLength =
      (sunsetTime.getTime() - sunriseTime.getTime()) / (60 * 60 * 1000);
    const dayHourLength = dayLength / 12;

    console.log(dayLength, dayHourLength);

    const nightLength = nextSunrise.getTime() - sunsetTime.getTime();
    const nightHourLength = nightLength / 12;

    const solarHours: {[key: string]: PlanetaryHour} = {};
    const lunarHours: {[key: string]: PlanetaryHour} = {};

    // Get the index of the day's ruler
    const dayRulerIndex = getDayRulerIndex(dayOfWeek);
    const planetaryRulerOfDay = CHALDEAN_ORDER[dayRulerIndex];

    // Solar Hours (1-12) from sunrise to sunset
    for (let i = 0; i < 12; i++) {
      const startTime = new Date(sunriseTime.getTime() + i * dayHourLength);
      const endTime = new Date(startTime.getTime() + dayHourLength);

      solarHours[`${i + 1}thSolarHour`] = {
        start: startTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
        end: endTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
        ruler: getPlanetaryRuler(i, dayRulerIndex),
      };
    }

    // Find the index of the last solar hour's ruler to start lunar hours
    const lastSolarHourRulerIndex = CHALDEAN_ORDER.findIndex(
      (ruler) => ruler === solarHours['12thSolarHour'].ruler
    );

    // Lunar Hours (1-12) from sunset to next sunrise
    for (let i = 0; i < 12; i++) {
      const startTime = new Date(sunsetTime.getTime() + i * nightHourLength);
      const endTime = new Date(startTime.getTime() + nightHourLength);

      lunarHours[`${i + 1}thLunarHour`] = {
        start: startTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
        end: endTime.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }),
        ruler: getPlanetaryRuler(i, lastSolarHourRulerIndex + 1),
      };
    }

    return {
      Response: {
        General: {
          Date: localDate.toISOString().split('T')[0],
          DayoftheWeek: dayOfWeek,
          PlanetaryRuler: planetaryRulerOfDay,
          Latitude: latitude.toString(),
          Longitude: longitude.toString(),
          //TimezoneOffset: localDate.getTimezoneOffset() * -60,
        },
        SolarHours: solarHours,
        LunarHours: lunarHours,
      },
    };
  } catch (error) {
    console.error('Failed to calculate planetary hours:', error);
    throw error;
  }
};

export const fetchPlanetaryHours = async (
  date: string,
  lat: number,
  lng: number
): Promise<PlanetaryHoursResponse> => {
  try {
    const dateObj = new Date(date);
    return await calculatePlanetaryHours(dateObj, lat, lng);
  } catch (error) {
    throw new Error('Failed to calculate planetary hours');
  }
};
