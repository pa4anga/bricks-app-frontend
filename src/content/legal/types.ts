export interface ILink {
  text: string;
  href: string;
}

export type IInlineNode = string | ILink;

export type IRichText = string | IInlineNode[];

export interface ILegalSection {
  title?: string;
  paragraphs?: IRichText[];
  lines?: IRichText[];
}

export interface ILegalContent {
  heading: string;
  sections: ILegalSection[];
}
