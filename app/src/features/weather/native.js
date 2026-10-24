import { Capacitor, registerPlugin } from '@capacitor/core';
import { App } from '@capacitor/app';
const plugin=registerPlugin('AgroWeather');
export const nativeWeather=Capacitor.isNativePlatform()?{
  configure:options=>plugin.configure(options),
  locate:options=>plugin.locate(options),
  cancelLocation:()=>plugin.cancelLocation(),
  readPosition:()=>plugin.readPosition(),
  locationSettings:()=>plugin.locationSettings(),
  read:loc=>plugin.read(loc),
  fetch:loc=>plugin.forecast(loc),
  async observe(callback){
    await App.addListener('appStateChange',state=>callback(state.isActive));
    callback((await App.getState()).isActive);
  },
}:null;
