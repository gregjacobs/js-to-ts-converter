import { Project } from "ts-morph";

const tsAstProject = new Project({
	compilerOptions: {
		strictNullChecks: true,
	},
});
const sourceFile = tsAstProject.createSourceFile("testfile.js", getSourceText());

// Just calling the below method is what causes the problem when moving later.
// If this line is commented out, the move succeeds.
sourceFile.getClass("TableHeader")!;

sourceFile.move("testfile.tsx");

function getSourceText() {
	return `
        class TableHeader extends React.Component {
            renderHeader() {
                const mapArr = this.props.columns
                    .map(columnDef => (
                        <div>
                            {(columnDef.sort !== false)
                                ? 'test'
                                : 'title'
                            }
                        </div>
                    ));

                return mapArr;
            }
        }
    `;
}
