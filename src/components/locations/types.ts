export interface IPriceEntryValue {
  source: string;
  price: string;
}

export interface ILocationFormValues {
  name: string;
  latitude: string;
  longitude: string;
  postcode: string;
  municipality: string;
  sapRegion: string;
  salesWbRegion: string;
  prices: IPriceEntryValue[];
}
