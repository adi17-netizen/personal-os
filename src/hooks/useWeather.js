import { useState, useEffect } from 'react'

// Map WeatherAPI condition codes → icon keys used by WeatherIcon SVG component
export function weatherApiCodeToIcon(code) {
  if (code === 1000) return '01d'                          // sunny/clear
  if ([1003].includes(code)) return '02d'                  // partly cloudy
  if ([1006, 1009].includes(code)) return '04d'            // cloudy/overcast
  if ([1030, 1135, 1147].includes(code)) return '50d'     // mist/fog
  if ([1087, 1273, 1276, 1279, 1282].includes(code)) return '11d' // thunder
  if (code >= 1114 && code <= 1237) return '13d'          // snow/sleet/ice
  if (code >= 1063 && code <= 1201) return '10d'          // rain
  return '02d'
}

// Hardcoded location — Mumbai
const CITY_LAT = 19.0760
const CITY_LON = 72.8777
const CITY_NAME = 'Mumbai'

export function useWeather() {
  const [data, setData] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState(null)

  const load = () => {
    setStatus('loading')
    setError(null)

    const fetchWeather = async () => {
      const key = import.meta.env.VITE_WEATHERAPI_KEY
      const res = await fetch(
        `https://api.weatherapi.com/v1/forecast.json?key=${key}&q=${CITY_LAT},${CITY_LON}&days=2&aqi=no&alerts=no`
      )
      if (!res.ok) throw new Error(`WeatherAPI ${res.status}`)
      const d = await res.json()

      const current = {
        name:      CITY_NAME,
        temp:      Math.round(d.current.temp_c),
        feelsLike: Math.round(d.current.feelslike_c),
        iconCode:  d.current.condition.code,
      }

      const toDay = (day) => ({
        high:        Math.round(day.day.maxtemp_c),
        low:         Math.round(day.day.mintemp_c),
        iconCode:    day.day.condition.code,
        description: day.day.condition.text,
      })

      const forecast = {
        today:    d.forecast.forecastday[0] ? toDay(d.forecast.forecastday[0]) : null,
        tomorrow: d.forecast.forecastday[1] ? toDay(d.forecast.forecastday[1]) : null,
      }

      setData({ current, forecast })
      setStatus('success')
    }

    fetchWeather().catch(e => { setError(e.message); setStatus('error') })
  }

  useEffect(() => { load() }, [])

  return { data, status, error, retry: load }
}
