package api

import (
	"net/http"
	rpcconssensus "github.com/blckit/go-rpc-client/consensus"
	"github.com/gin-gonic/gin"
)

func MetricsConsensusTreeHandler(c *gin.Context) {
	reply, err := rpcconssensus.GetTree("json")
	if err != nil {
		c.Error(err)
		c.AbortWithError(http.StatusInternalServerError, err)
		return
	}

	c.Data(200, "application/json; charset=utf-8", []byte(reply.Tree))
}
