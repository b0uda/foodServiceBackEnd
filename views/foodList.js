exports =
  `<html>
  <head>
    <script src="https://code.jquery.com/jquery-1.11.1.min.js"></script>

    <link href="//datatables.net/download/build/nightly/jquery.dataTables.css" rel="stylesheet" type="text/css" />
    <script src="//datatables.net/download/build/nightly/jquery.dataTables.js"></script>
    <style>
    // Table Styles

    // flexbox support for scroll-y
    
    @mixin dt-display-flex {
      display: -webkit-flex; // support for responsive scroll-y
      display: -ms-flexbox;
      display: flex;
    }
    @mixin dt-flex-11a {
      -webkit-flex: 1 1 auto;
      -ms-flex: 1 1 auto;
      flex: 1 1 auto;
    }
    @mixin dt-flex-100 {
      -webkit-flex: 1 0 0px;
      -ms-flex: 1 0 0px;
      flex: 1 0 0px;
    }
    @mixin dt-flex-vertical {
      -webkit-flex-flow: column nowrap;
      -ms-flex-flow: column nowrap;
      flex-flow: column nowrap;
    }
    
    // codepen example support
    html, body {
      height:100%;
      width: 100%;
      max-width: 100%;
      overflow-y: hidden;
    }
    
    // core layout
    
    .container {
      @include dt-display-flex;
      @include dt-flex-11a;
      height: 80%; // codepen - vary to see flex rule in action
      width: 60%;  // codepen - vary to see flex rule in action
      //  code rules to better identify container visually
      background-color: #f0f0f0;
      border: 1px solid blue;
      margin-top: 1rem;
      padding: 1rem;
    }
    
    .dataTables_wrapper {
      width: 100%;
      overflow: hidden;
      -webkit-overflow-scrolling: touch;
      -ms-overflow-style: -ms-autohiding-scrollbar;
      @include dt-display-flex;
      @include dt-flex-vertical;
      @include dt-flex-11a;
    }
    
    table.dataTable {
      background-color: #fff;
      width: 100%;
      margin: 0 auto;
      clear: both;
      border-collapse: separate;
      border-spacing: 0;
    }
    
    // header
    
    table.dataTable thead,
    table.dataTable tfoot {
      background-color: #f5f5f5;
    }
    
    table.dataTable thead th,
    table.dataTable tfoot th {
      font-weight: bold;
      border-bottom: 1px solid #111111;
    }
    
    table.dataTable thead th:active,
    table.dataTable thead td:active {
      outline: none;
    }
    
    // rows
    
    table.dataTable tr.even,
    table.dataTable tr.alt,
    table.dataTable tr:nth-of-type(even) {
      background: #F9F9F9;
    }
    
    // compact toggle
    // table.dataTable.dt-compact th,
    // table.dataTable.dt-compact td {
    // font-size: .875rem;
    // padding: .5rem .625rem;
    // text-align: left;
    // white-space: nowrap;
    // }
    
    table.dataTable th,
    table.dataTable td {
      padding: 1rem;
      white-space: nowrap;
      text-align: left;
    }
    
    table.dataTable tfoot th,
    table.dataTable tfoot td {
      border-top: 1px solid #111111;
    }
    
    // hover indicator(s)
    
    table.dataTable tbody > tr:hover {
      background-color: lightblue;
    }
    
    // scroll-x and scroll-y support
    // content-box rule is critical
    
    table.dataTable,
    table.dataTable th,
    table.dataTable td {
      -webkit-box-sizing: content-box;
      -moz-box-sizing: content-box;
      box-sizing: content-box;
    }
    .dataTables_wrapper .dataTables_scroll {
      clear: both;
      @include dt-display-flex;
      @include dt-flex-vertical;
      @include dt-flex-11a;
      // codepen rules to better identify scroll wrapper
      border: 1px solid #ccc;
      margin: 1.5rem 0
    }
    
    .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody {
      @include dt-flex-100;
      margin-top: -1px;
      -webkit-overflow-scrolling: touch;
    }
    
    // Fixes issue with Safari width calc. under rare conditions
    .dataTables_scrollHeadInner {
      flex: 1 1 auto;
    }
    
    .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody th > div.dataTables_sizing,
    .dataTables_wrapper .dataTables_scroll div.dataTables_scrollBody td > div.dataTables_sizing {
      height: 0;
      overflow: hidden;
      margin: 0 !important;
      padding: 0 !important;
    }
    
    .dataTables_wrapper:after {
      visibility: hidden;
      display: block;
      content: "";
      clear: both;
      height: 0;
    }
    
    // column sorting indicators
    
    table.dataTable thead .sorting_asc,
    table.dataTable thead .sorting_desc,
    table.dataTable thead .sorting {
      cursor: pointer;
    }
    table.dataTable thead .sorting {
      background: url("../img/datatables/sort_both.png") no-repeat center right;
      background: #00adf7;
      color:white;

    }

    table.dataTable tfoot {
      background: #00adf7;
      color:white;
    }

    table.dataTable thead .sorting_asc {
      background: url("../img/datatables/sort_asc.png") no-repeat center right;
      background: #4CAF50;
      color:white;
    }
    table.dataTable thead .sorting_desc {
      background: url("../img/datatables/sort_desc.png") no-repeat center right;
      background: red;
      color:white;
    }
    table.dataTable thead .sorting_asc_disabled {
      background: url("../img/datatables/sort_asc_disabled.png") no-repeat center right;
      background: purple;
    }
    table.dataTable thead .sorting_desc_disabled {
      background: url("../img/datatables/sort_desc_disabled.png") no-repeat center right;
      background: cyan;
    }

     

    h1{
text-align:center;
font-size:3rem;

    }
    .container{
      background:white;
      color:#00adf7;
      padding:10px;

    }
    body{
      background:#00adf7; 
    }
   
 
  

  #example{
    margin-top:20px;
    
  }



  .overlay {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    background: rgba(0, 0, 0, 0.7);
    transition: opacity 500ms;
    visibility: hidden;
    opacity: 0;
  }
  .overlay:target {
    visibility: visible;
    opacity: 1;
  }
  
  .popup {
    margin: 700px auto;
    padding: 20px;
    background: #fff;
    border-radius: 5px;
    width: 30%;
    position: relative;
    transition: all 5s ease-in-out;
    margin-top:100px;
  }
  
  .popup h2 {
    margin-top: 0;
    color: #00adf7;
    font-family: Tahoma, Arial, sans-serif;
  }
  .popup .close {
    position: absolute;
    top: 20px;
    right: 30px;
    transition: all 200ms;
    font-size: 30px;
    font-weight: bold;
    text-decoration: none;
    color: #333;
  }
  .popup .close:hover {
    color: #00adf7;
  }
  .popup .content {
    max-height: 30%;
    overflow: auto;
  }
  
  @media screen and (max-width: 700px){
    .box{
      width: 70%;
    }
    .popup{
      width: 70%;
    }
  }

  .button{
    width: 50px;
    height: 50px;
    background:#00adf7;
    display:inline-block;
    color:white;
    line-height:3rem;
    border:none;
    font-size:3rem;
    text-decoration:none;
    transition:all 1s;
    margin-left:50px;
  }

  .button:hover{
    transform: scale(1.1);
  }
  

  .form {
    position: relative;
    z-index: 1;
    background: #FFFFFF;
    max-width: 360px;
    margin: 0 auto 100px;
    padding: 45px;
    text-align: center;

  }
  .form input {
    font-family: "Roboto", sans-serif;
    outline: 0;
    background: #f2f2f2;
    width: 100%;
    border: 0;
    margin: 0 0 15px;
    padding: 15px;
    box-sizing: border-box;
    font-size: 14px;
  }
  .form button {
    font-family: "Roboto", sans-serif;
    text-transform: uppercase;
    outline: 0;
    background: #00adf7;
    width: 100%;
    border: 0;
    padding: 15px;
    color: #FFFFFF;
    font-size: 14px;
    -webkit-transition: all 0.3 ease;
    transition: all 0.3 ease;
    cursor: pointer;
  }
  .form button:hover,.form button:active,.form button:focus {
    background: #00f3ff;
  }


    </style>
    <meta charset=utf-8 />
    <title>DataTables - JS Bin</title>
  </head>
  <body>
    <div class="container">
   <div class="box" style="text-align:center;">
   <h1 style=" display:inline-block;">List of Foods Json </h1>
    <a class="button " href="#popup1">+</a>
  </div>  
      <table id="example"
        datatable="" width="100%" cellspacing="0"
        data-page-length="33"
        data-scroll-x="true"
        scroll-collapse="false">
        <thead>
          <tr>
          <th>id</th>
          <th>place</th>
          <th>name</th>
          <th>category</th>
          <th>price</th>
          <th>Photo</th>
          </tr>
        </thead>

        <tfoot>
          <tr>
          <th>id</th>
          <th>place</th>
          <th>name</th>
          <th>category</th>
          <th>price</th>
          <th>Photo</th>
          </tr>
        </tfoot>

        <tbody>

        <% for(var food in foodList) { %>
          <tr>
          <td><%= foodList[food].id %></td>
          <td><%= foodList[food].place %></td>
          <td><%= foodList[food].name %></td>
          <td><%= foodList[food].category %></td>
          <td><%= foodList[food].price %></td>
          <td>has photo</td>
        </tr>
        
          <% } %>
      
        
        
        </tbody>
      </table>
    </div>

    

<div id="popup1" class="overlay">
	<div class="popup form">
		<h2>Add new Food form</h2>
		<a class="close" href="#">&times;</a>
		 
    <form method="post" action="http://localhost:3030/foodAdd" class="login-form">
    <input name="name" type="text" placeholder="name"/>
    <input name="place" type="text" placeholder="place"/>
    <input name="category" type="text" placeholder="category"/>
    <input name="price" type="text" placeholder="price"/>
      <input type="submit" value="Ajouter" />

  </form>	 
	</div>
</div>
    
    <script>
    $(document).ready( function () {
      var table = $('#example').DataTable();
    } );

   
    </script>
  </body>
</html>`