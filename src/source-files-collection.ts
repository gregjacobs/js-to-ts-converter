import * as File from 'vinyl';

export class SourceFilesCollection {

	constructor(
		private files: File[]
	) {}


	getByPath( path: string ): File | null {
		return this.files.find( file => file.path === path ) || null;
	}
	
}