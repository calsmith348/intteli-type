//component to be used for rich text https://github.com/facebook/draft-js 
import React, { useEffect, useState } from 'react';
import { Editor, EditorState, RichUtils, Modifier,SelectionState } from "draft-js";

import IntelliBoxProps from '../../interfaces/IntelliBoxProps'
import colorStyleMap from './IntelliBox.Constants'

import './IntelliBox.css';

function getFilterList(key:string,list:string[]) {
    const pattern = new RegExp('^'+key.toLowerCase());
    return list.filter(item => { return pattern.test(item.toLowerCase()) });
}

function getLastChange(newState: EditorState, oldState: EditorState) {
    //If user deleted a character
    if(oldState.getCurrentContent().getPlainText().length > newState.getCurrentContent().getPlainText().length) {
        return -1
    }
    const currentSelection = newState.getSelection();
    return newState.getCurrentContent().getPlainText().charAt(currentSelection.getAnchorOffset() - 1);
}

function getChangeBlock(newState:EditorState) {
    const changeOffset = newState.getSelection().getAnchorOffset() - 1;
    const currentContent = newState.getCurrentContent().getPlainText();
    if(changeOffset < 0) {
        return '';
    }
    
    let blockStart,blockEnd = 0;
    let blockText = '';
    currentContent.split(' ').forEach(item => {
        blockStart = blockEnd;
        blockEnd =blockEnd + item.length;
        if(blockStart <= changeOffset && blockEnd >= changeOffset) {
             blockText = item;
        }
    });

    return blockText;
}


function validateItem( textToValidate:string, list:string[]) {
    const isValid = list.some(item => item.toLowerCase() === textToValidate.toLocaleLowerCase());
    return isValid;
}

function highlightErrorText(newState: EditorState,setEditorState:React.Dispatch<React.SetStateAction<EditorState>>) { 
    //store current selection for now
    let currentSelection = newState.getSelection();
   
    let key = newState.getCurrentContent().getBlockMap().last().getKey();
    const changeOffset = newState.getSelection().getAnchorOffset() - 1;
    const currentContentText = newState.getCurrentContent().getPlainText();

    const currentBlockStartAndEnd = getCurrentBlockStartAndEnd(currentContentText,changeOffset);

    const selection = new SelectionState({
        anchorKey: key,
        anchorOffset: currentBlockStartAndEnd[0],
        focusKey: key,
        focusOffset: currentBlockStartAndEnd[1],
    });
    newState =  EditorState.forceSelection(newState,selection);
    if(!newState.getCurrentInlineStyle().has('red')) {
        newState =  RichUtils.toggleInlineStyle(newState,'red');
        setEditorState(newState);
    }
    newState =  EditorState.forceSelection(newState,currentSelection);
    setEditorState(newState);
    return newState;
}

function removeHighlight(newState: EditorState,setEditorState:React.Dispatch<React.SetStateAction<EditorState>>) { 
    //store current selection for now
    let currentSelection = newState.getSelection();
   
    let key = newState.getCurrentContent().getBlockMap().last().getKey();
    const changeOffset = newState.getSelection().getAnchorOffset() - 1;
    const currentContentText = newState.getCurrentContent().getPlainText();

    const currentBlockStartAndEnd = getCurrentBlockStartAndEnd(currentContentText,changeOffset);
    
    const selection = new SelectionState({
        anchorKey: key,
        anchorOffset: currentBlockStartAndEnd[0],
        focusKey: key,
        focusOffset: currentBlockStartAndEnd[1],
    });
    newState =  EditorState.forceSelection(newState,selection);
    if(newState.getCurrentInlineStyle().has('red')) {
        newState =  RichUtils.toggleInlineStyle(newState,'red');
        setEditorState(newState);
    }
    newState =  EditorState.forceSelection(newState,currentSelection);
    setEditorState(newState);
    return newState;
}

function getCurrentBlockStartAndEnd(currentContentText:string, changeOffset:number) {
    let blockStart=0,blockEnd = 0;
    let blockText = '';
    currentContentText.split(' ').every(item => {
        blockStart = blockEnd;
        blockEnd =blockEnd + item.length;
        if(blockStart <= changeOffset && blockEnd >= changeOffset) {
             blockText = item;
             return false;
        }
        return true;
    });

    return [blockStart, blockEnd-1]
}



function validateColumn() {

}

function getPointerLocation() {

}

function setPointerLocation() {

}



function IntelliBox(props:IntelliBoxProps) {
    const jsonList = JSON.parse(props.tableList());
    let tableList:string[] = jsonList.Tables;
    const [filterList,setFilterList] = useState<string[]>([]);
    const [editorState, setEditorState] = useState(() => EditorState.createEmpty());
    
    const onStateChange = (newState: EditorState) =>{

        //If there is no change in text just return
        if(newState.getCurrentContent().getPlainText().toLowerCase() === editorState.getCurrentContent().getPlainText().toLowerCase()){
            setEditorState(newState);
            return;
        }
        
        const filterBlock = getChangeBlock(newState);

        //If change in a block that has a '.', then we have to see if user is trying to modify table name or column name
        //Else user is typing table name
        if(filterBlock.indexOf('.')>0) {
            
            const isValid = validateItem(filterBlock.split('.')[0],tableList)

            if(isValid) {
                newState =removeHighlight(newState,setEditorState);
            }
            else {
                newState =highlightErrorText(newState,setEditorState);
            }

            //find if cursor is before or after dot
            const isSubList = filterBlock.indexOf('.') < newState.getSelection().getAnchorOffset();

            //if cursor is after dot that mean user is typing column names 
            //Else user is trying table name
            if(isSubList && isValid) {
                const searchKey = Object.keys(jsonList).find(key=> key.toLowerCase() === filterBlock.split('.')[0].toLocaleLowerCase()) as string;
                let filterList = jsonList[searchKey];

                let filterKey = filterBlock.split('.')[1];
                setFilterList(getFilterList(filterKey,filterList));
            }
            else if(!isSubList) {
                let filterKey = filterBlock.split('.')[0];
                setFilterList(getFilterList(filterKey,tableList))
                //validateTable(newState, filterKey,tableList)
            }
        }
        else {
            setFilterList(getFilterList(filterBlock,tableList));
        }

        setEditorState(newState);
    }

    return (
	    <>
            <Editor editorState={editorState} onChange={onStateChange} customStyleMap={colorStyleMap}/>
            <ul className='suggestionsList'>
                {filterList.map(item => {
                    return <li key={item}>{item}</li>;
                })}
            </ul>
	    </>
	);
}

export default IntelliBox;