import React, {Component} from 'react'
import { Container } from '@material-ui/core';
import Card from '../Card/Card'
import Grid from '@material-ui/core/Grid';
import Paper from '@material-ui/core/Grid';
import Background from '../../Assets/Img/searchbackground.jpg'

const gridStyle = {
    color: 'blue',
    marginTop: '5%', 
  };




export default function SearchGrid(props) {
    return (
        <Paper>
            
            <Container style={gridStyle}>
            
            <Grid container spacing={4} >
                { props.content.map(function(recipe, index){
                       return(
                        <Grid items >
                        <Card recipe={recipe} content={props.content}/>
                        </Grid>
                    );
                })}
            
            </Grid>
            </Container>
        </Paper>
    );
}
