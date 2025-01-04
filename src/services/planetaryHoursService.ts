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
      [key: string]: {
        Start: string;
        End: string;
        Ruler: string;
      };
    };
    LunarHours: {
      [key: string]: {
        Start: string;
        End: string;
        Ruler: string;
      };
    };
  };
}

export const fetchPlanetaryHours = async (
  date: string,
  lat: number,
  lng: number
): Promise<PlanetaryHoursResponse> => {
  const response = await fetch(
    `http://www.planetaryhoursapi.com/api/${date}/${lat},${lng}`
  );
  if (!response.ok) {
    throw new Error('Failed to fetch planetary hours');
  }
  return response.json();
};
